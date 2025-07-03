import { promises as fs } from "node:fs";
import path from "node:path";
import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { ImportExportService } from "@/core/domain/dataImportExport/ports/importExportService";
import type {
  DataType,
  ExportConfig,
  Format,
  ImportConfig,
  ImportExportJob,
} from "@/core/domain/dataImportExport/types";
import { ApplicationError } from "@/lib/error";

export class DrizzlePqliteImportExportService implements ImportExportService {
  constructor(private readonly context: Context) {}
  getSupportedFormats(): Format[] {
    return ["csv", "json", "xlsx", "xml"];
  }

  getSupportedDataTypes(): DataType[] {
    return [
      "customers",
      "contacts",
      "leads",
      "deals",
      "activities",
      "users",
      "organizations",
      "proposals",
      "documents",
      "all",
    ];
  }

  async validateImportFile(
    filePath: string,
    format: Format,
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      switch (format) {
        case "csv":
          return this.validateCsvFile(filePath);
        case "json":
          return this.validateJsonFile(filePath);
        case "xlsx":
          return this.validateXlsxFile(filePath);
        case "xml":
          return this.validateXmlFile(filePath);
        default:
          return err(new ApplicationError(`Unsupported format: ${format}`));
      }
    } catch (error) {
      return err(new ApplicationError("Failed to validate import file", error));
    }
  }

  async processImport(
    job: ImportExportJob,
  ): Promise<Result<void, ApplicationError>> {
    try {
      if (!job.filePath) {
        return err(new ApplicationError("File path is required for import"));
      }

      switch (job.format) {
        case "csv":
          return this.processCsvImport(job);
        case "json":
          return this.processJsonImport(job);
        case "xlsx":
          return this.processXlsxImport(job);
        case "xml":
          return this.processXmlImport(job);
        default:
          return err(
            new ApplicationError(`Unsupported import format: ${job.format}`),
          );
      }
    } catch (error) {
      return err(new ApplicationError("Failed to process import", error));
    }
  }

  async processExport(
    job: ImportExportJob,
  ): Promise<Result<string, ApplicationError>> {
    try {
      switch (job.format) {
        case "csv":
          return this.processCsvExport(job);
        case "json":
          return this.processJsonExport(job);
        case "xlsx":
          return this.processXlsxExport(job);
        case "xml":
          return this.processXmlExport(job);
        default:
          return err(
            new ApplicationError(`Unsupported export format: ${job.format}`),
          );
      }
    } catch (error) {
      return err(new ApplicationError("Failed to process export", error));
    }
  }

  private async validateCsvFile(
    filePath: string,
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const lines = content
        .split("\n")
        .filter((line) => line.trim().length > 0);

      if (lines.length === 0) {
        return err(new ApplicationError("CSV file is empty"));
      }

      // Basic CSV validation - check for consistent column count
      const firstLineColumns = this.parseCsvLine(lines[0]).length;
      for (let i = 1; i < Math.min(lines.length, 10); i++) {
        const columns = this.parseCsvLine(lines[i]);
        if (columns.length !== firstLineColumns) {
          return err(
            new ApplicationError(`Inconsistent column count at line ${i + 1}`),
          );
        }
      }

      return ok(true);
    } catch (error) {
      return err(new ApplicationError("Failed to validate CSV file", error));
    }
  }

  private async validateJsonFile(
    filePath: string,
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        return err(
          new ApplicationError("JSON file must contain an array of objects"),
        );
      }

      if (data.length === 0) {
        return err(new ApplicationError("JSON file is empty"));
      }

      // Validate that all items are objects
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        if (typeof data[i] !== "object" || data[i] === null) {
          return err(new ApplicationError(`Invalid object at index ${i}`));
        }
      }

      return ok(true);
    } catch (error) {
      return err(new ApplicationError("Failed to validate JSON file", error));
    }
  }

  private async validateXlsxFile(
    filePath: string,
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      const stats = await fs.stat(filePath);

      if (stats.size === 0) {
        return err(new ApplicationError("XLSX file is empty"));
      }

      // Check file extension
      const extension = path.extname(filePath).toLowerCase();
      if (extension !== ".xlsx" && extension !== ".xls") {
        return err(new ApplicationError("Invalid Excel file extension"));
      }

      // Basic binary file validation (check for Excel magic bytes)
      const buffer = await fs.readFile(filePath);
      const magicBytes = buffer.slice(0, 4);
      const isZip = magicBytes[0] === 0x50 && magicBytes[1] === 0x4b; // PK zip signature

      if (!isZip && extension === ".xlsx") {
        return err(new ApplicationError("Invalid XLSX file format"));
      }

      return ok(true);
    } catch (error) {
      return err(new ApplicationError("Failed to validate XLSX file", error));
    }
  }

  private async validateXmlFile(
    filePath: string,
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      const content = await fs.readFile(filePath, "utf8");

      if (content.trim().length === 0) {
        return err(new ApplicationError("XML file is empty"));
      }

      // Basic XML validation
      const trimmedContent = content.trim();
      if (!trimmedContent.startsWith("<")) {
        return err(
          new ApplicationError("Invalid XML format - must start with '<'"),
        );
      }

      // Check for balanced tags (basic validation)
      const openTags = (content.match(/<[^/!?][^>]*>/g) || []).length;
      const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
      const selfClosingTags = (content.match(/<[^>]*\/>/g) || []).length;

      if (openTags !== closeTags + selfClosingTags) {
        return err(
          new ApplicationError("Invalid XML format - unbalanced tags"),
        );
      }

      return ok(true);
    } catch (error) {
      return err(new ApplicationError("Failed to validate XML file", error));
    }
  }

  private async processCsvImport(
    job: ImportExportJob,
  ): Promise<Result<void, ApplicationError>> {
    try {
      if (!job.filePath) {
        return err(new ApplicationError("File path is required"));
      }

      const content = await fs.readFile(job.filePath, "utf8");
      const config = (job.config as ImportConfig) || {};
      const _delimiter = config.delimiter || ",";
      const hasHeaders = config.hasHeaders !== false;
      const skipRows = config.skipRows || 0;

      const lines = content
        .split("\n")
        .filter((line) => line.trim().length > 0);

      if (lines.length === 0) {
        return err(new ApplicationError("CSV file is empty"));
      }

      // Skip rows if specified
      const dataLines = lines.slice(skipRows);
      const headers = hasHeaders ? this.parseCsvLine(dataLines[0]) : [];
      const dataRows = hasHeaders ? dataLines.slice(1) : dataLines;

      let processedCount = 0;
      let errorCount = 0;

      for (const line of dataRows) {
        const values = this.parseCsvLine(line);

        if (values.length === 0) continue;

        const record = hasHeaders
          ? this.mapCsvRowToObject(headers, values, config.columnMapping)
          : this.mapCsvRowToObject([], values, config.columnMapping);

        const result = await this.processRecord(job.dataType, record, "import");

        if (result.isErr()) {
          errorCount++;
          console.error(
            `Error processing record ${processedCount + 1}:`,
            result.error,
          );
        } else {
          processedCount++;
        }
      }

      // Update job progress
      await this.updateJobProgress(job.id, {
        processedRecords: processedCount,
        errorRecords: errorCount,
        totalRecords: dataRows.length,
      });

      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError("Failed to process CSV import", error));
    }
  }

  private async processJsonImport(
    job: ImportExportJob,
  ): Promise<Result<void, ApplicationError>> {
    try {
      if (!job.filePath) {
        return err(new ApplicationError("File path is required"));
      }

      const content = await fs.readFile(job.filePath, "utf8");
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        return err(
          new ApplicationError("JSON file must contain an array of objects"),
        );
      }

      let processedCount = 0;
      let errorCount = 0;

      for (const record of data) {
        if (typeof record !== "object" || record === null) {
          errorCount++;
          continue;
        }

        const result = await this.processRecord(job.dataType, record, "import");

        if (result.isErr()) {
          errorCount++;
          console.error(
            `Error processing record ${processedCount + 1}:`,
            result.error,
          );
        } else {
          processedCount++;
        }
      }

      // Update job progress
      await this.updateJobProgress(job.id, {
        processedRecords: processedCount,
        errorRecords: errorCount,
        totalRecords: data.length,
      });

      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError("Failed to process JSON import", error));
    }
  }

  private async processXlsxImport(
    _job: ImportExportJob,
  ): Promise<Result<void, ApplicationError>> {
    try {
      // For now, we'll implement a basic XLSX reader or suggest CSV export
      // In a production environment, you'd use a library like 'xlsx' or 'exceljs'
      return err(
        new ApplicationError(
          "XLSX import not yet implemented. Please convert to CSV format.",
        ),
      );
    } catch (error) {
      return err(new ApplicationError("Failed to process XLSX import", error));
    }
  }

  private async processXmlImport(
    job: ImportExportJob,
  ): Promise<Result<void, ApplicationError>> {
    try {
      if (!job.filePath) {
        return err(new ApplicationError("File path is required"));
      }

      const content = await fs.readFile(job.filePath, "utf8");
      const records = this.parseXmlToRecords(content);

      let processedCount = 0;
      let errorCount = 0;

      for (const record of records) {
        const result = await this.processRecord(job.dataType, record, "import");

        if (result.isErr()) {
          errorCount++;
          console.error(
            `Error processing record ${processedCount + 1}:`,
            result.error,
          );
        } else {
          processedCount++;
        }
      }

      // Update job progress
      await this.updateJobProgress(job.id, {
        processedRecords: processedCount,
        errorRecords: errorCount,
        totalRecords: records.length,
      });

      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError("Failed to process XML import", error));
    }
  }

  private async processCsvExport(
    job: ImportExportJob,
  ): Promise<Result<string, ApplicationError>> {
    try {
      const records = await this.fetchRecordsForExport(
        job.dataType,
        job.config,
      );

      if (records.length === 0) {
        return err(new ApplicationError("No records found for export"));
      }

      const config = (job.config as ExportConfig) || {};
      const delimiter = config.delimiter || ",";
      const includeHeaders = config.includeHeaders !== false;
      const encoding = config.encoding || "utf8";

      // Generate CSV content
      const headers = Object.keys(records[0]);
      let csvContent = "";

      if (includeHeaders) {
        csvContent +=
          headers.map((header) => this.escapeCsvValue(header)).join(delimiter) +
          "\n";
      }

      for (const record of records) {
        const values = headers.map((header) => {
          const value = record[header];
          return this.escapeCsvValue(this.formatValueForExport(value, config));
        });
        csvContent += `${values.join(delimiter)}\n`;
      }

      // Create exports directory if it doesn't exist
      const exportsDir = "./exports";
      await fs.mkdir(exportsDir, { recursive: true });

      // Write file
      const filePath = path.join(exportsDir, job.fileName);
      await fs.writeFile(filePath, csvContent, { encoding: encoding as BufferEncoding });

      // Update job progress
      await this.updateJobProgress(job.id, {
        processedRecords: records.length,
        totalRecords: records.length,
      });

      return ok(filePath);
    } catch (error) {
      return err(new ApplicationError("Failed to process CSV export", error));
    }
  }

  private async processJsonExport(
    job: ImportExportJob,
  ): Promise<Result<string, ApplicationError>> {
    try {
      const records = await this.fetchRecordsForExport(
        job.dataType,
        job.config,
      );

      if (records.length === 0) {
        return err(new ApplicationError("No records found for export"));
      }

      const config = (job.config as ExportConfig) || {};
      const encoding = (config.encoding as BufferEncoding) || "utf8";

      // Format records for JSON export
      const formattedRecords = records.map((record) => {
        const formatted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
          formatted[key] = this.formatValueForExport(value, config);
        }
        return formatted;
      });

      const jsonContent = JSON.stringify(formattedRecords, null, 2);

      // Create exports directory if it doesn't exist
      const exportsDir = "./exports";
      await fs.mkdir(exportsDir, { recursive: true });

      // Write file
      const filePath = path.join(exportsDir, job.fileName);
      await fs.writeFile(filePath, jsonContent, encoding);

      // Update job progress
      await this.updateJobProgress(job.id, {
        processedRecords: records.length,
        totalRecords: records.length,
      });

      return ok(filePath);
    } catch (error) {
      return err(new ApplicationError("Failed to process JSON export", error));
    }
  }

  private async processXlsxExport(
    _job: ImportExportJob,
  ): Promise<Result<string, ApplicationError>> {
    try {
      // For now, we'll suggest CSV export instead
      // In a production environment, you'd use a library like 'xlsx' or 'exceljs'
      return err(
        new ApplicationError(
          "XLSX export not yet implemented. Please use CSV format.",
        ),
      );
    } catch (error) {
      return err(new ApplicationError("Failed to process XLSX export", error));
    }
  }

  private async processXmlExport(
    job: ImportExportJob,
  ): Promise<Result<string, ApplicationError>> {
    try {
      const records = await this.fetchRecordsForExport(
        job.dataType,
        job.config,
      );

      if (records.length === 0) {
        return err(new ApplicationError("No records found for export"));
      }

      const config = (job.config as ExportConfig) || {};
      const encoding = config.encoding || "utf8";

      // Generate XML content
      const xmlContent = this.generateXmlFromRecords(
        records,
        job.dataType,
        config,
      );

      // Create exports directory if it doesn't exist
      const exportsDir = "./exports";
      await fs.mkdir(exportsDir, { recursive: true });

      // Write file
      const filePath = path.join(exportsDir, job.fileName);
      await fs.writeFile(filePath, xmlContent, { encoding: encoding as BufferEncoding });

      // Update job progress
      await this.updateJobProgress(job.id, {
        processedRecords: records.length,
        totalRecords: records.length,
      });

      return ok(filePath);
    } catch (error) {
      return err(new ApplicationError("Failed to process XML export", error));
    }
  }

  // Helper methods for CSV processing
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  private mapCsvRowToObject(
    headers: string[],
    values: string[],
    columnMapping?: Record<string, string>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (headers.length > 0) {
      // Use headers to map values
      for (let i = 0; i < headers.length && i < values.length; i++) {
        const header = headers[i];
        const mappedHeader = columnMapping?.[header] || header;
        result[mappedHeader] = this.parseValue(values[i]);
      }
    } else {
      // Use column mapping or index-based mapping
      for (let i = 0; i < values.length; i++) {
        const key = columnMapping?.[i.toString()] || `column_${i}`;
        result[key] = this.parseValue(values[i]);
      }
    }

    return result;
  }

  private parseValue(value: string): unknown {
    if (value === "") return null;

    // Try to parse as number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Try to parse as date
    const dateValue = new Date(value);
    if (!Number.isNaN(dateValue.getTime()) && value.includes("-")) {
      return dateValue;
    }

    return value;
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatValueForExport(value: unknown, config: ExportConfig): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return config.dateFormat
        ? this.formatDate(value, config.dateFormat)
        : value.toISOString();
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private formatDate(date: Date, format: string): string {
    // Simple date formatting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
      .replace("YYYY", year.toString())
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }

  // Helper methods for XML processing
  private parseXmlToRecords(xmlContent: string): Record<string, unknown>[] {
    const records: Record<string, unknown>[] = [];

    // Simple XML parsing - look for repeating record elements
    const recordPattern = /<record[^>]*>([\s\S]*?)<\/record>/gi;
    let match: RegExpExecArray | null;

    match = recordPattern.exec(xmlContent);
    while (match !== null) {
      const recordContent = match[1];
      const record = this.parseXmlRecord(recordContent);
      records.push(record);
      match = recordPattern.exec(xmlContent);
    }

    return records;
  }

  private parseXmlRecord(recordContent: string): Record<string, unknown> {
    const record: Record<string, unknown> = {};
    const fieldPattern = /<([^>]+)>([\s\S]*?)<\/\1>/g;
    let match: RegExpExecArray | null;

    match = fieldPattern.exec(recordContent);
    while (match !== null) {
      const fieldName = match[1];
      const fieldValue = match[2];
      record[fieldName] = this.parseValue(fieldValue);
      match = fieldPattern.exec(recordContent);
    }

    return record;
  }

  private generateXmlFromRecords(
    records: Record<string, unknown>[],
    dataType: DataType,
    config: ExportConfig,
  ): string {
    const rootElement = dataType === "all" ? "data" : dataType;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    for (const record of records) {
      xml += "  <record>\n";

      for (const [key, value] of Object.entries(record)) {
        const formattedValue = this.formatValueForExport(value, config);
        const escapedValue = this.escapeXmlValue(formattedValue);
        xml += `    <${key}>${escapedValue}</${key}>\n`;
      }

      xml += "  </record>\n";
    }

    xml += `</${rootElement}>\n`;
    return xml;
  }

  private escapeXmlValue(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Helper methods for data processing
  private async processRecord(
    dataType: DataType,
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    try {
      switch (dataType) {
        case "customers":
          return await this.processCustomerRecord(record, operation);
        case "contacts":
          return await this.processContactRecord(record, operation);
        case "leads":
          return await this.processLeadRecord(record, operation);
        case "deals":
          return await this.processDealRecord(record, operation);
        case "activities":
          return await this.processActivityRecord(record, operation);
        case "users":
          return await this.processUserRecord(record, operation);
        case "organizations":
          return await this.processOrganizationRecord(record, operation);
        case "proposals":
          return await this.processProposalRecord(record, operation);
        case "documents":
          return await this.processDocumentRecord(record, operation);
        default:
          return err(
            new ApplicationError(`Unsupported data type: ${dataType}`),
          );
      }
    } catch (error) {
      return err(
        new ApplicationError(`Failed to process ${dataType} record`, error),
      );
    }
  }

  private async processCustomerRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      // Map record fields to customer creation parameters
      const customerData = {
        name: String(record.name || record.customer_name || record.companyName || ""),
        industry: record.industry ? String(record.industry) : undefined,
        size: record.size as "small" | "medium" | "large" | "enterprise" | undefined,
        location: record.location ? String(record.location) : undefined,
        foundedYear: record.foundedYear
          ? Number(record.foundedYear)
          : undefined,
        website: record.website ? String(record.website) : undefined,
        description: record.description ? String(record.description) : undefined,
        status: (record.status as "active" | "inactive" | "archived") || "active",
        assignedUserId: record.assignedUserId ? String(record.assignedUserId) : undefined,
      };

      const result = await this.context.customerRepository.create(customerData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create customer", error),
      );
    }

    return ok(record);
  }

  private async processContactRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const contactData = {
        customerId: String(record.customerId || record.customer_id || ''),
        name: String(record.name || record.contact_name || record.fullName || ''),
        title: String(record.title || record.job_title || ''),
        department: String(record.department || ''),
        email: String(record.email || record.email_address || ''),
        phone: String(record.phone || record.phone_number || ''),
        mobile: String(record.mobile || record.mobile_number || ''),
        isPrimary: Boolean(record.isPrimary || record.is_primary),
        isActive: record.isActive !== false,
      };

      const result = await this.context.contactRepository.create(contactData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create contact", error),
      );
    }

    return ok(record);
  }

  private async processLeadRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const leadData = {
        firstName:
          String(record.firstName ||
          record.first_name ||
          (typeof record.name === 'string' ? record.name.split(" ")[0] : '') ||
          ""),
        lastName:
          String(record.lastName ||
          record.last_name ||
          (typeof record.name === 'string' ? record.name.split(" ").slice(1).join(" ") : '') ||
          ""),
        email: String(record.email || record.email_address || ''),
        phone: String(record.phone || record.phone_number || ''),
        company: String(record.company || record.company_name || ''),
        title: String(record.title || record.job_title || ''),
        industry: String(record.industry || ''),
        source: String(record.source || record.lead_source || ''),
        status: (record.status as "new" | "contacted" | "qualified" | "converted" | "rejected") || "new",
        score: record.score ? Number(record.score) : 0,
        tags: Array.isArray(record.tags) ? record.tags as string[] : [],
        notes: String(record.notes || record.description || ''),
        assignedUserId: String(record.assignedUserId || ''),
      };

      const result = await this.context.leadRepository.create(leadData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create lead", error),
      );
    }

    return ok(record);
  }

  private async processDealRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const dealData = {
        title: String(record.title || record.deal_name || record.name || ''),
        customerId: String(record.customerId || record.customer_id || ''),
        contactId: String(record.contactId || record.contact_id || ''),
        stage: (record.stage as "prospecting" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost") || "prospecting",
        amount: record.amount ? String(record.amount) : "0",
        probability: record.probability ? Number(record.probability) : 0,
        expectedCloseDate: record.expectedCloseDate && typeof record.expectedCloseDate === 'string'
          ? new Date(record.expectedCloseDate)
          : undefined,
        description: String(record.description || record.notes || ''),
        competitors: Array.isArray(record.competitors) ? record.competitors as string[] : [],
        assignedUserId: String(record.assignedUserId || record.assigned_user_id || ''),
      };

      const result = await this.context.dealRepository.create(dealData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create deal", error),
      );
    }

    return ok(record);
  }

  private async processActivityRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const activityData = {
        type: (record.type as "email" | "task" | "call" | "meeting" | "note") || "task",
        subject: String(record.subject || record.title || record.name || ''),
        description: String(record.description || record.notes || ''),
        status: (record.status as "completed" | "planned" | "in_progress" | "cancelled") || "planned",
        priority: (record.priority as "medium" | "low" | "high" | "urgent") || "medium",
        scheduledAt: record.scheduledAt && typeof record.scheduledAt === 'string'
          ? new Date(record.scheduledAt)
          : undefined,
        dueDate: record.dueDate && typeof record.dueDate === 'string' ? new Date(record.dueDate) : undefined,
        duration: record.duration ? Number(record.duration) : undefined,
        customerId: String(record.customerId || record.customer_id || ''),
        contactId: String(record.contactId || record.contact_id || ''),
        dealId: String(record.dealId || record.deal_id || ''),
        leadId: String(record.leadId || record.lead_id || ''),
        assignedUserId: String(record.assignedUserId || record.assigned_user_id || ''),
        createdByUserId: String(record.createdByUserId || record.created_by_user_id || ''),
      };

      const result = await this.context.activityRepository.create(activityData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create activity", error),
      );
    }

    return ok(record);
  }

  private async processUserRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const userData = {
        email: String(record.email || record.email_address || ''),
        name: String(record.name || record.full_name || record.username || ''),
        role: (record.role as "user" | "admin" | "manager") || "user",
        isActive: record.isActive !== false,
        passwordHash: String(record.password || "defaultPassword123"), // Should be handled securely
      };

      const result = await this.context.userRepository.create(userData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create user", error),
      );
    }

    return ok(record);
  }

  private async processOrganizationRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const orgData = {
        name: String(record.name || record.organization_name || ''),
        displayName: String(record.displayName || record.display_name || ''),
        description: String(record.description || ''),
        industry: String(record.industry || ''),
        size: (record.size as "small" | "medium" | "large" | "enterprise" | undefined) || undefined,
        foundedYear: record.foundedYear
          ? Number(record.foundedYear)
          : undefined,
        website: String(record.website || ''),
        email: String(record.email || ''),
        phone: String(record.phone || ''),
        address: String(record.address || ''),
        country: String(record.country || ''),
        timezone: String(record.timezone || "UTC"),
        currency: String(record.currency || "USD"),
        language: String(record.language || "en"),
        settings: (record.settings as Record<string, unknown>) || {},
        isActive: record.isActive !== false,
      };

      const result =
        await this.context.organizationRepository.createOrganization(orgData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create organization", error),
      );
    }

    return ok(record);
  }

  private async processProposalRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const proposalData = {
        dealId: String(record.dealId || record.deal_id || ''),
        customerId: String(record.customerId || record.customer_id || ''),
        contactId: String(record.contactId || record.contact_id || ''),
        title: String(record.title || record.proposal_title || ''),
        description: String(record.description || ''),
        status: String(record.status || "draft"),
        type: (record.type as "proposal" | "quote" | "estimate") || "proposal",
        validUntil: record.validUntil && typeof record.validUntil === 'string' ? new Date(record.validUntil) : undefined,
        subtotal: record.subtotal ? Number(record.subtotal) : 0,
        discountAmount: record.discountAmount
          ? Number(record.discountAmount)
          : 0,
        discountPercent: record.discountPercent
          ? Number(record.discountPercent)
          : 0,
        taxAmount: record.taxAmount ? Number(record.taxAmount) : 0,
        taxPercent: record.taxPercent ? Number(record.taxPercent) : 0,
        totalAmount: record.totalAmount ? Number(record.totalAmount) : 0,
        currency: String(record.currency || "USD"),
        terms: String(record.terms || ''),
        notes: String(record.notes || ''),
        createdBy: String(record.createdBy || record.created_by || ''),
      };

      const result =
        await this.context.proposalRepository.createProposal(proposalData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create proposal", error),
      );
    }

    return ok(record);
  }

  private async processDocumentRecord(
    record: Record<string, unknown>,
    operation: "import" | "export",
  ): Promise<Result<unknown, ApplicationError>> {
    if (operation === "import") {
      const documentData = {
        filename: String(record.filename || record.file_name || ''),
        originalFilename: String(
          record.originalFilename ||
          record.original_filename ||
          record.filename || ''
        ),
        mimeType: String(
          record.mimeType || record.mime_type || "application/octet-stream"
        ),
        size: record.size ? Number(record.size) : 0,
        url: String(record.url || record.file_url || ''),
        description: String(record.description || ''),
        tags: Array.isArray(record.tags) ? record.tags as string[] : [],
        entityType: (record.entityType || record.entity_type || "general") as "general" | "customer" | "contact" | "deal" | "lead" | "activity",
        entityId: String(record.entityId || record.entity_id || ''),
        uploadedBy: String(record.uploadedBy || record.uploaded_by || ''),
        isPublic: record.isPublic !== false,
      };

      const result = await this.context.documentRepository.create(documentData);
      return result.mapErr(
        (error) => new ApplicationError("Failed to create document", error),
      );
    }

    return ok(record);
  }

  private createDefaultQuery(filters: Record<string, unknown> = {}) {
    return {
      pagination: {
        page: 1,
        limit: 1000,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      sortOrder: "desc" as const,
      filter: filters,
    };
  }

  private async fetchRecordsForExport(
    dataType: DataType,
    config?: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const filters = (config as ExportConfig)?.filters || {};

    switch (dataType) {
      case "customers": {
        const query = this.createDefaultQuery(filters);
        const customerResult =
          await this.context.customerRepository.list(query);
        return customerResult.isOk() ? customerResult.value.items : [];
      }
      case "contacts": {
        const query = this.createDefaultQuery(filters);
        const contactResult =
          await this.context.contactRepository.list(query);
        return contactResult.isOk() ? contactResult.value.items : [];
      }
      case "leads": {
        const query = this.createDefaultQuery(filters);
        const leadResult = await this.context.leadRepository.list(query);
        return leadResult.isOk() ? leadResult.value.items : [];
      }
      case "deals": {
        const query = this.createDefaultQuery(filters);
        const dealResult = await this.context.dealRepository.list(query);
        return dealResult.isOk() ? dealResult.value.items : [];
      }
      case "activities": {
        const query = this.createDefaultQuery(filters);
        const activityResult =
          await this.context.activityRepository.list(query);
        return activityResult.isOk() ? activityResult.value.items : [];
      }
      case "users": {
        const query = this.createDefaultQuery(filters);
        const userResult = await this.context.userRepository.list(query);
        return userResult.isOk() ? userResult.value.items : [];
      }
      case "organizations": {
        const query = this.createDefaultQuery(filters);
        const orgResult =
          await this.context.organizationRepository.listOrganizations(query);
        return orgResult.isOk() ? orgResult.value.items : [];
      }
      case "proposals": {
        const query = {
          pagination: {
            page: 1,
            limit: 1000,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: filters,
        };
        const proposalResult =
          await this.context.proposalRepository.listProposals(query);
        return proposalResult.isOk() ? proposalResult.value.items : [];
      }
      case "documents": {
        const query = this.createDefaultQuery(filters);
        const documentResult =
          await this.context.documentRepository.list(query);
        return documentResult.isOk() ? documentResult.value.items : [];
      }
      case "all": {
        // Export all data types - combine all records
        const allRecords: Record<string, unknown>[] = [];
        const dataTypes: DataType[] = [
          "customers",
          "contacts",
          "leads",
          "deals",
          "activities",
          "users",
          "organizations",
          "proposals",
          "documents",
        ];

        for (const type of dataTypes) {
          const records = await this.fetchRecordsForExport(type, config);
          allRecords.push(
            ...records.map((record) => ({ ...record, _dataType: type })),
          );
        }

        return allRecords;
      }
      default:
        return [];
    }
  }

  private async updateJobProgress(
    jobId: string,
    progress: {
      processedRecords?: number;
      errorRecords?: number;
      totalRecords?: number;
    },
  ): Promise<void> {
    try {
      await this.context.importExportRepository.update(jobId, {
        processedRecords: progress.processedRecords,
        errorRecords: progress.errorRecords,
        totalRecords: progress.totalRecords,
      });
    } catch (error) {
      console.error("Failed to update job progress:", error);
    }
  }
}

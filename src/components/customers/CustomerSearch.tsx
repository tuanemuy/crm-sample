"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function CustomerSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 検索処理を実装
    console.log("Searching for:", searchTerm);
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="font-semibold text-base-content mb-3">顧客検索</h3>

        <form onSubmit={handleSearch}>
          <div className="join w-full">
            <input
              type="text"
              placeholder="会社名、担当者名、業界..."
              className="input input-bordered join-item flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-primary join-item">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

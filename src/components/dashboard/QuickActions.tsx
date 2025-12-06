import {
  BriefcaseIcon,
  DocumentPlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface QuickAction {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      href: "/customers/new",
      label: "新規顧客",
      icon: UserGroupIcon,
      color: "btn-primary",
    },
    {
      href: "/deals/new",
      label: "新規商談",
      icon: BriefcaseIcon,
      color: "btn-secondary",
    },
    {
      href: "/activities/new",
      label: "活動追加",
      icon: DocumentPlusIcon,
      color: "btn-accent",
    },
  ];

  return (
    <div className="flex gap-2">
      {actions.map((action, _index) => {
        const Icon = action.icon;

        return (
          <Link key={action.href} href={action.href}>
            <button
              type="button"
              className={`btn ${action.color} btn-sm gap-2`}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </button>
          </Link>
        );
      })}
    </div>
  );
}

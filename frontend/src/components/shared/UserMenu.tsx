import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Dropdown, { DropdownDivider, DropdownHeader, DropdownItem } from "./Dropdown";
import { useSession, initialsFromName } from "./SessionProvider";
import { useToast } from "./ToastProvider";
import { useLocale } from "../../i18n/useLocale";
import { cn } from "../../utils/cn";

const Icon = ({ path, fill = false }: { path: string; fill?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
);

/**
 * Avatar + dropdown shown in the navbar when a user is signed in. Routes to the
 * account, library, wallet, and (role-gated) studio + admin surfaces.
 */
export default function UserMenu({ className }: { className?: string }) {
  const { user, isArtist, signOut } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { localize } = useLocale();

  if (!user) return null;

  const initials = initialsFromName(user.name);

  const go = (path: string) => () => navigate(localize(path));

  const onSignOut = () => {
    signOut();
    toast.info(t("toast.signedOutTitle"), t("toast.signedOutBody"));
    navigate(localize("/"));
  };

  return (
    <Dropdown
      label={t("userMenu.label")}
      align="right"
      widthClass="w-64"
      trigger={(toggle, isOpen) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={cn(
            "flex items-center gap-2 rounded-full bg-bg-card ring-1 ring-white/10 pl-1 pr-3 py-1 transition-all duration-150 hover:ring-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green",
            className
          )}
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-green to-brand-greenDark text-bg text-[11px] font-extrabold"
          >
            {initials}
          </span>
          <span className="hidden sm:inline text-xs font-semibold text-white truncate max-w-[7rem]">
            {user.name.split(" ")[0]}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={cn("h-3.5 w-3.5 text-white/55 transition-transform", isOpen && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    >
      <DropdownHeader>
        <div className="font-semibold text-white truncate">{user.name}</div>
        <div className="truncate text-white/55">{user.email}</div>
      </DropdownHeader>
      <DropdownDivider />
      <DropdownItem onSelect={go("/library")} icon={<Icon path="M4 4h6v16H4zM14 4h6v10h-6zM14 16h6v4h-6z" />}>
        {t("userMenu.myLibrary")}
      </DropdownItem>
      <DropdownItem onSelect={go("/wallet")} icon={<Icon path="M3 7h18v12H3zM16 12h2" />}>
        {t("userMenu.wallet")}
      </DropdownItem>
      <DropdownItem onSelect={go("/account")} icon={<Icon path="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />}>
        {t("userMenu.account")}
      </DropdownItem>
      {isArtist ? (
        <DropdownItem onSelect={go("/studio")} icon={<Icon path="M3 3v18h18M8 15l3-4 3 3 4-6" />}>
          {t("userMenu.artistStudio")}
        </DropdownItem>
      ) : (
        <DropdownItem onSelect={go("/studio")} icon={<Icon path="M12 5v14M5 12h14" />}>
          {t("userMenu.becomeArtist")}
        </DropdownItem>
      )}
      {user.role === "admin" && (
        <DropdownItem onSelect={go("/admin")} icon={<Icon path="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />}>
          {t("userMenu.admin")}
        </DropdownItem>
      )}
      <DropdownDivider />
      <DropdownItem
        tone="danger"
        onSelect={onSignOut}
        icon={<Icon path="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />}
      >
        {t("userMenu.signOut")}
      </DropdownItem>
    </Dropdown>
  );
}

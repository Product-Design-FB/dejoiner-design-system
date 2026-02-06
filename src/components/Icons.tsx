"use client";

import { SVGProps } from "react";

// Icon sizes
export type IconSize = "sm" | "md" | "lg";

const sizes: Record<IconSize, number> = {
    sm: 16,
    md: 20,
    lg: 24,
};

interface IconProps extends SVGProps<SVGSVGElement> {
    size?: IconSize;
}

// Base icon wrapper
function IconBase({ size = "md", children, ...props }: IconProps & { children: React.ReactNode }) {
    const s = sizes[size];
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {children}
        </svg>
    );
}

// Navigation & Actions
export function SearchIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </IconBase>
    );
}

export function FilterIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </IconBase>
    );
}

export function SortIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="16" y2="12" />
            <line x1="4" y1="18" x2="12" y2="18" />
        </IconBase>
    );
}

export function GridIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
        </IconBase>
    );
}

export function ListIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </IconBase>
    );
}

export function PlusIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </IconBase>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </IconBase>
    );
}

export function MoreVerticalIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </IconBase>
    );
}

export function ExternalLinkIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </IconBase>
    );
}

export function LinkIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </IconBase>
    );
}

export function CopyIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </IconBase>
    );
}

export function EditIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </IconBase>
    );
}

export function TrashIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </IconBase>
    );
}

export function StarIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </IconBase>
    );
}

export function ShareIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </IconBase>
    );
}

// Status & Feedback
export function CheckIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polyline points="20 6 9 17 4 12" />
        </IconBase>
    );
}

export function CheckCircleIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </IconBase>
    );
}

export function AlertCircleIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </IconBase>
    );
}

export function InfoIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </IconBase>
    );
}

export function LoaderIcon(props: IconProps) {
    return (
        <IconBase {...props} className="animate-spin">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </IconBase>
    );
}

// Content & Media
export function FileIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </IconBase>
    );
}

export function FolderIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </IconBase>
    );
}

export function ImageIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </IconBase>
    );
}

export function EyeIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </IconBase>
    );
}

// Time
export function ClockIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </IconBase>
    );
}

export function CalendarIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </IconBase>
    );
}

// Arrows & Chevrons
export function ChevronDownIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polyline points="6 9 12 15 18 9" />
        </IconBase>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polyline points="9 18 15 12 9 6" />
        </IconBase>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polyline points="15 18 9 12 15 6" />
        </IconBase>
    );
}

export function ArrowUpIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </IconBase>
    );
}

// Source Icons (with filled circles)
export function FigmaIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" fill="currentColor" stroke="none" />
            <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" fill="currentColor" stroke="none" />
            <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" fill="currentColor" stroke="none" />
            <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" fill="currentColor" stroke="none" />
            <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" fill="currentColor" stroke="none" />
        </IconBase>
    );
}

export function GithubIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </IconBase>
    );
}

export function DriveIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M12 2L2 19h20L12 2z" />
        </IconBase>
    );
}

// Special
export function SparklesIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
            <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
            <path d="M19 13l.5 1.5L21 15l-1.5.5L19 17l-.5-1.5L17 15l1.5-.5L19 13z" />
        </IconBase>
    );
}

export function UserIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </IconBase>
    );
}

export function ZapIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </IconBase>
    );
}

export function SearchXIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="8" x2="14" y2="14" />
            <line x1="14" y1="8" x2="8" y2="14" />
        </IconBase>
    );
}

// Source icon circle (colored background)
interface SourceIconCircleProps {
    type: "figma" | "github" | "drive" | "docs";
    size?: IconSize;
}

export function SourceIconCircle({ type, size = "md" }: SourceIconCircleProps) {
    const s = sizes[size];

    const colors: Record<string, string> = {
        figma: "#0066FF",
        github: "#FF0062",
        drive: "#FF6B00",
        docs: "#FF6B00",
    };

    const letters: Record<string, string> = {
        figma: "F",
        github: "G",
        drive: "D",
        docs: "D",
    };

    return (
        <div
            style={{
                width: s,
                height: s,
                borderRadius: "50%",
                backgroundColor: colors[type] || "#525252",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: s * 0.5,
                fontWeight: 600,
            }}
        >
            {letters[type] || "?"}
        </div>
    );
}

import type { ReactNode } from 'react'

function Icon({ children, filled = false }: { children: ReactNode; filled?: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const ScatterIcon = () => (
  <Icon filled>
    <circle cx="5" cy="6" r="2" />
    <circle cx="16" cy="4" r="1.6" />
    <circle cx="18" cy="15" r="2" />
    <circle cx="7" cy="17" r="1.6" />
    <circle cx="12" cy="10.5" r="1.2" />
  </Icon>
)

export const SearchIcon = () => (
  <Icon>
    <circle cx="9.5" cy="9.5" r="6" />
    <path d="M14 14l4.5 4.5" />
  </Icon>
)

export const LibraryIcon = () => (
  <Icon>
    <path d="M4 3.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5H6.5A2.5 2.5 0 0 1 4 16V3.5Z" />
    <path d="M4 16a2.5 2.5 0 0 1 2.5-2.5h11" />
    <path d="M8 7.5h6" />
  </Icon>
)

export const HistoryIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="8.5" />
    <path d="M11 6.5V11l3 2" />
  </Icon>
)

export const KeypadIcon = () => (
  <Icon filled>
    {[3, 11, 19].flatMap((y) => [3, 11, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />))}
  </Icon>
)

export const CopyIcon = () => (
  <Icon>
    <rect x="7" y="7" width="11" height="11" rx="2.5" />
    <path d="M4 14V6.5A2.5 2.5 0 0 1 6.5 4H14" />
  </Icon>
)

export const LinkIcon = () => (
  <Icon>
    <path d="M9.5 12.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
    <path d="M12.5 9.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
  </Icon>
)

export const PinIcon = ({ filled }: { filled: boolean }) => (
  <Icon filled={filled}>
    <path d="M8 3.5h6l-1 5 3 3v1.5H6V11.5l3-3-1-5Z" stroke="currentColor" />
    <path d="M11 13v5.5" stroke="currentColor" />
  </Icon>
)

export const InsertIcon = () => (
  <Icon>
    <path d="M17 5v5.5a2 2 0 0 1-2 2H5" />
    <path d="M8.5 9 5 12.5 8.5 16" />
  </Icon>
)

// Shared reusable components
// These components are meant to be used across the application to avoid code duplication

// Dialogs
export { ConfirmDialog } from './confirm-dialog'

// Status indicators
export { 
  StatusBadge, 
  AssessmentStatusBadge,
  PdiStatusBadge,
  ActiveStatusBadge,
  ASSESSMENT_STATUS_CONFIG,
  PDI_STATUS_CONFIG,
  ACTIVE_STATUS_CONFIG
} from './status-badge'

// User display
export { UserAvatar, getInitials } from './user-avatar'

// Loading and empty states
export { LoadingState, ButtonSpinner } from './loading-state'
export { EmptyState, TableEmptyState } from './empty-state'

// Calendar
export { CalendarToolbar } from './calendar-toolbar'

// Score display
export { ScoreBadge, getScoreColorClass } from './score-badge'


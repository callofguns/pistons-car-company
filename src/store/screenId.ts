/** Every navigable screen. Main Menu is a screen like any other (not a separate route) so the router handles it uniformly - same approach as the Unity port's UIRouter. */
export type ScreenId =
  | 'MainMenu'
  | 'OfficeHub'
  | 'BodySelection'
  | 'CarDesign'
  | 'ModelLineup'
  | 'SalesStatistics'
  | 'Research'
  | 'Employees'
  | 'Promotion'
  | 'Company'
  | 'TeamCreation'
  | 'Bank'

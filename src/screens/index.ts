import type { ComponentType } from 'react'
import type { ScreenId } from '../store/screenId'
import { MainMenuScreen } from './MainMenuScreen'
import { CompanyNamingScreen } from './CompanyNamingScreen'
import { SaveSlotsScreen } from './SaveSlotsScreen'
import { OfficeHubScreen } from './OfficeHubScreen'
import { BodySelectionScreen } from './BodySelectionScreen'
import { CarDesignScreen } from './CarDesignScreen'
import { ModelLineupScreen } from './ModelLineupScreen'
import { SalesStatisticsScreen } from './SalesStatisticsScreen'
import { ResearchScreen } from './ResearchScreen'
import { EmployeesScreen } from './EmployeesScreen'
import { PromotionScreen } from './PromotionScreen'
import { CompanyScreen } from './CompanyScreen'
import { TeamCreationScreen } from './TeamCreationScreen'
import { BankScreen } from './BankScreen'

export const SCREENS: Record<ScreenId, ComponentType> = {
  MainMenu: MainMenuScreen,
  CompanyNaming: CompanyNamingScreen,
  SaveSlots: SaveSlotsScreen,
  OfficeHub: OfficeHubScreen,
  BodySelection: BodySelectionScreen,
  CarDesign: CarDesignScreen,
  ModelLineup: ModelLineupScreen,
  SalesStatistics: SalesStatisticsScreen,
  Research: ResearchScreen,
  Employees: EmployeesScreen,
  Promotion: PromotionScreen,
  Company: CompanyScreen,
  TeamCreation: TeamCreationScreen,
  Bank: BankScreen,
}

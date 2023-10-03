import CalcTablesProvider, { useCalcTables } from './CalcTablesProvider'
import SettingsProvider, { useSettings } from './SettingsProvider'
import SideBarProvider, { useSidebar } from './SideBarProvider'
import CalcResultProvider, { useCalcResult } from './CalcResultProvider'
import AuthProvider, { useAuth } from './AuthProvider'
import LoadingProvider, { useLoading } from './LoadingProvider'

export {
    AuthProvider,
    CalcResultProvider,
    CalcTablesProvider,
    LoadingProvider,
    SettingsProvider,
    SideBarProvider,
    useAuth,
    useCalcResult,
    useCalcTables,
    useLoading,
    useSettings,
    useSidebar
}
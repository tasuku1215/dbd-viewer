import { useStore } from './store'
import SetupScreen from './components/SetupScreen'
import ViewerScreen from './components/ViewerScreen'

export default function App() {
  const isSetup = useStore((s) => s.isSetup)
  return isSetup ? <SetupScreen /> : <ViewerScreen />
}

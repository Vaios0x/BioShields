declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react'
  
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    color?: string
    strokeWidth?: string | number
  }
  
  // Footer icons
  export const Shield: ComponentType<LucideProps>
  export const Twitter: ComponentType<LucideProps>
  export const Github: ComponentType<LucideProps>
  export const MessageCircle: ComponentType<LucideProps>
  export const Users: ComponentType<LucideProps>
  
  // Claims page icons
  export const FileText: ComponentType<LucideProps>
  export const Upload: ComponentType<LucideProps>
  export const CheckCircle: ComponentType<LucideProps>
  export const Clock: ComponentType<LucideProps>
  export const AlertTriangle: ComponentType<LucideProps>
  export const Plus: ComponentType<LucideProps>
  export const Eye: ComponentType<LucideProps>
  export const Download: ComponentType<LucideProps>
  export const ExternalLink: ComponentType<LucideProps>
  export const Calendar: ComponentType<LucideProps>
  export const Hash: ComponentType<LucideProps>
  
  // Dashboard icons
  export const TrendingUp: ComponentType<LucideProps>
  export const DollarSign: ComponentType<LucideProps>
  export const Activity: ComponentType<LucideProps>
  export const PieChart: ComponentType<LucideProps>
  
  // Marketplace icons
  export const Search: ComponentType<LucideProps>
  export const Filter: ComponentType<LucideProps>
  export const Star: ComponentType<LucideProps>
  export const Calculator: ComponentType<LucideProps>
  export const Zap: ComponentType<LucideProps>
  
  // Home page icons
  export const ArrowRight: ComponentType<LucideProps>
  
  // Premium Calculator icons
  export const X: ComponentType<LucideProps>
  
  // Navbar icons
  export const Menu: ComponentType<LucideProps>
  export const Wallet: ComponentType<LucideProps>
  export const Network: ComponentType<LucideProps>
  
  // Governance page icons
  export const Vote: ComponentType<LucideProps>
  export const XCircle: ComponentType<LucideProps>
  export const BarChart3: ComponentType<LucideProps>
  
  // Pools page icons
  export const Minus: ComponentType<LucideProps>
  export const Lock: ComponentType<LucideProps>
  export const Unlock: ComponentType<LucideProps>
  
  // ClaimForm icons
  export const Loader2: ComponentType<LucideProps>
  
  // MobileBottomNav icons
  export const Home: ComponentType<LucideProps>
  
  // NetworkSwitcher icons
  export const ChevronDown: ComponentType<LucideProps>
  export const Check: ComponentType<LucideProps>
  
  // TokenBalance icons
  export const Coins: ComponentType<LucideProps>
  
  // WalletConnect icons
  export const LogOut: ComponentType<LucideProps>
  export const Copy: ComponentType<LucideProps>
}

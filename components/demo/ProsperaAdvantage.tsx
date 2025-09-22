'use client'

import { motion } from 'framer-motion'
import { 
  Zap, 
  Shield, 
  Clock, 
  DollarSign, 
  CheckCircle,
  ArrowRight,
  Users,
  TrendingUp
} from 'lucide-react'

export function ProsperaAdvantage() {
  const advantages = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "70% Faster Processing",
      description: "Insurance claims processed in seconds, not months",
      metric: "12 seconds vs 3-6 months",
      color: "text-green-400"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "No FDA Delays",
      description: "Alternative regulatory framework enables instant coverage",
      metric: "0 regulatory delays",
      color: "text-blue-400"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "$LIVES Integration",
      description: "50% discount when paying with Infinita City tokens",
      metric: "50% savings",
      color: "text-yellow-400"
    },
    {
      icon: <span className="text-2xl">🌍</span>,
      title: "Multi-Chain Support",
      description: "Deploy on Solana, Base, Optimism and more",
      metric: "3+ networks",
      color: "text-purple-400"
    },
    {
      icon: <span className="text-2xl">🏢</span>,
      title: "Próspera Jurisdiction",
      description: "Special economic zone with innovative regulations",
      metric: "First-mover advantage",
      color: "text-cyan-400"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "DeSci Community",
      description: "Built for the decentralized science ecosystem",
      metric: "1000+ researchers",
      color: "text-pink-400"
    }
  ]

  const stats = [
    {
      label: "Traditional Insurance",
      value: "3-6 months",
      color: "text-red-400"
    },
    {
      label: "BioShield in Próspera",
      value: "12 seconds",
      color: "text-green-400"
    },
    {
      label: "Cost Reduction",
      value: "70%",
      color: "text-blue-400"
    },
    {
      label: "Success Rate",
      value: "99.9%",
      color: "text-purple-400"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Why This Only Works in <span className="text-gradient bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Próspera</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Próspera's innovative regulatory framework enables the world's first 
            truly decentralized parametric insurance for biotech research.
          </p>
        </motion.div>
      </div>

      {/* Comparison Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advantages Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advantages.map((advantage, index) => (
          <motion.div
            key={advantage.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center ${advantage.color}`}>
                {advantage.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {advantage.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  {advantage.description}
                </p>
                <div className={`text-sm font-medium ${advantage.color}`}>
                  {advantage.metric}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Próspera Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20"
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              About Próspera
            </h3>
            <p className="text-gray-300 mb-4">
              Próspera is a special economic zone in Honduras that provides a 
              regulatory sandbox for innovative technologies. This unique 
              jurisdiction allows BioShield to operate with unprecedented 
              speed and efficiency.
            </p>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Regulatory Innovation</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Processing Time</span>
              <span className="text-green-400 font-bold">12 seconds</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Regulatory Delays</span>
              <span className="text-green-400 font-bold">0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Cost Reduction</span>
              <span className="text-blue-400 font-bold">70%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Success Rate</span>
              <span className="text-purple-400 font-bold">99.9%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <div className="glass-card p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Experience the Future?
          </h3>
          <p className="text-gray-300 mb-6">
            Join the DeSci revolution and get instant insurance coverage 
            for your biotech research projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Get Coverage Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Learn More
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

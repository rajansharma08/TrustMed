import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Scan, CheckCircle, PackagePlus, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: PackagePlus,
    title: "Create Origin",
    description: "Manufacturer registers medicine on blockchain with batch details and QR code generation.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Scan,
    title: "Track Transit",
    description: "Supply chain partners scan and add checkpoints, updating the on-chain history in real time.",
    color: "bg-info/10 text-info",
  },
  {
    icon: CheckCircle,
    title: "Verify Authenticity",
    description: "Customers scan QR codes to verify the full journey and AI-powered authenticity assessment.",
    color: "bg-success/10 text-success",
  },
];

const HomePage = () => (
  <div className="min-h-screen">
    {/* Hero */}
    <section className="gradient-hero">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4" />
            Blockchain-Powered Traceability
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground text-balance leading-tight">
            Trust Every Medicine,{" "}
            <span className="gradient-text">From Source to Patient</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            End-to-end pharmaceutical supply chain verification using immutable blockchain records, QR tracing, and AI-powered authenticity detection.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground border-0 px-8 h-12 text-base font-semibold">
              <Link to="/create">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 text-base">
              <Link to="/verify">Verify a Medicine</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>

    {/* How it works */}
    <section className="container mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-display font-bold text-foreground">How It Works</h2>
        <p className="text-muted-foreground mt-2">Three simple steps to guarantee pharmaceutical authenticity</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass-card p-6 space-y-4 group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step {i + 1}</span>
            </div>
            <h3 className="text-xl font-display font-bold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Action Cards */}
    <section className="container mx-auto px-4 pb-20">
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: "Create Medicine", desc: "Register a new medicine batch on the blockchain", path: "/create", icon: PackagePlus },
          { title: "Add Checkpoint", desc: "Scan and log a transit checkpoint", path: "/scan-add", icon: Scan },
          { title: "Verify Medicine", desc: "Check authenticity and trace history", path: "/verify", icon: Shield },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={card.path}
              className="glass-card p-6 flex flex-col gap-4 hover:shadow-lg hover:border-primary/30 transition-all group block h-full"
            >
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <card.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
              <span className="text-primary text-sm font-medium flex items-center gap-1 mt-auto group-hover:gap-2 transition-all">
                Go <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  </div>
);

export default HomePage;

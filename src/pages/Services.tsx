import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Video, Mic, CalendarDays, Clock, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CostCalculator from "@/components/CostCalculator";
import servicePhotography from "@/assets/service-photography.jpg";
import serviceVideography from "@/assets/service-videography.jpg";
import serviceHosting from "@/assets/service-hosting.jpg";
import servicePlanning from "@/assets/service-planning.jpg";

const services = [
  {
    id: "photography",
    icon: Camera,
    title: "Photography",
    rate: "£150",
    image: servicePhotography,
    description:
      "We capture life's most meaningful moments with unmatched creativity and technical precision. From intimate ceremonies to grand galas, every shot tells a story.",
    includes: [
      "High-resolution digital images",
      "Professional editing & colour grading",
      "Online delivery gallery",
      "Printed highlights album (optional)",
      "Turnaround: 7–14 days",
    ],
    eventTypes: ["Weddings", "Corporate Events", "Birthday Galas", "Portraits", "Product Shoots"],
  },
  {
    id: "videography",
    icon: Video,
    title: "Videography",
    rate: "£200",
    image: serviceVideography,
    description:
      "Cinematic storytelling that transforms your event into a film-quality production. We shoot with professional cinema cameras and deliver stunning highlight reels.",
    includes: [
      "4K cinematic footage",
      "Professional colour grading & audio mix",
      "Highlight reel (2–5 minutes)",
      "Full event cut (optional)",
      "Turnaround: 14–21 days",
    ],
    eventTypes: ["Weddings", "Live Shows", "Corporate Films", "Birthday Events", "Drone Footage"],
  },
  {
    id: "event-hosting",
    icon: Mic,
    title: "Event Hosting",
    rate: "£180",
    image: serviceHosting,
    description:
      "Professional MC and event hosting services that keep your audience engaged and your event flowing flawlessly. Polished, charismatic, and always on time.",
    includes: [
      "Pre-event briefing & script prep",
      "Professional MC services",
      "Guest engagement & interaction",
      "Coordination with AV teams",
      "Post-event wrap-up",
    ],
    eventTypes: ["Corporate Galas", "Award Ceremonies", "Weddings", "Launch Events", "Charity Dinners"],
  },
  {
    id: "event-planning",
    icon: CalendarDays,
    title: "Event Planning",
    rate: "£120",
    image: servicePlanning,
    description:
      "End-to-end event planning and coordination. We handle the details so you can enjoy the moment. From concept to execution — flawless every time.",
    includes: [
      "Full event concept & design",
      "Vendor coordination & management",
      "On-the-day coordination",
      "Budget management",
      "Post-event debrief",
    ],
    eventTypes: ["Weddings", "Corporate Events", "Birthday Celebrations", "Private Parties", "Charity Events"],
  },
];

export default function Services() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="pt-32 pb-16 text-center px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-4"
        >
          What We Offer
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="font-display text-6xl md:text-7xl text-foreground mb-4"
        >
          Our Services
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="font-body text-muted-foreground text-sm max-w-xl mx-auto"
        >
          Premium multimedia services across the UK. All services are priced per hour — deposits secure your date.
        </motion.p>
      </div>

      {/* SERVICE CARDS */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-6 pb-24">
        {services.map((service, i) => (
          <motion.div
            key={service.id}
            id={service.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.05 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border overflow-hidden group"
          >
            <div className={`relative overflow-hidden aspect-[4/3] lg:aspect-auto ${i % 2 === 1 ? "lg:order-2" : ""}`}>
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute top-6 left-6">
                <span className="font-body text-xs tracking-[0.3em] uppercase bg-primary text-primary-foreground px-3 py-1">
                  {service.rate}/hr
                </span>
              </div>
            </div>

            <div className={`p-10 lg:p-14 bg-card flex flex-col justify-center ${i % 2 === 1 ? "lg:order-1" : ""}`}>
              <service.icon className="text-primary mb-4" size={28} />
              <h2 className="font-display text-4xl text-foreground mb-4">{service.title}</h2>
              <p className="font-body text-muted-foreground text-sm leading-relaxed mb-8">{service.description}</p>

              <div className="mb-8">
                <p className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-4">What's Included</p>
                <ul className="space-y-2">
                  {service.includes.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle size={14} className="text-primary flex-shrink-0" />
                      <span className="font-body text-xs text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <p className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-3">Event Types</p>
                <div className="flex flex-wrap gap-2">
                  {service.eventTypes.map((type) => (
                    <span key={type} className="font-body text-xs px-3 py-1 border border-border text-muted-foreground">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/booking?service=${service.id}`}
                  className="font-body text-xs tracking-[0.3em] uppercase px-8 py-4 bg-primary text-primary-foreground hover:bg-primary-light transition-all duration-300"
                >
                  Book {service.title}
                </Link>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={14} />
                  <span className="font-body text-xs">From {service.rate}/hr</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PRICING NOTE */}
      <div className="border-t border-border py-14 px-6 text-center bg-card">
        <p className="font-display text-3xl text-foreground mb-3">Need Multiple Services?</p>
        <p className="font-body text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
          Bundle photography and videography for a discounted package rate. Contact us for a custom quote.
        </p>
        <Link
          to="/booking"
          className="font-body text-xs tracking-[0.3em] uppercase px-10 py-4 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 inline-block"
        >
          Get a Custom Quote
        </Link>
      </div>
      <Footer />
      <CostCalculator />
    </div>
  );
}

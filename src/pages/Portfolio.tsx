import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CostCalculator from "@/components/CostCalculator";
import { Search } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  featured: boolean;
}

const categories = [
  { key: "all", label: "All Work" },
  { key: "weddings", label: "Weddings" },
  { key: "corporate", label: "Corporate" },
  { key: "birthdays", label: "Birthdays" },
  { key: "hosting", label: "Hosting" },
];

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    supabase
      .from("portfolio")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setItems(data || []));
  }, []);

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <div className="pt-32 pb-10 text-center px-6">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-4">
          Our Work
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="font-display text-6xl text-foreground mb-6">
          Portfolio
        </motion.h1>
        <p className="font-body text-muted-foreground text-sm max-w-lg mx-auto">
          A curated selection of our finest work — weddings, corporate events, celebrations, and live shows across the UK.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex justify-center gap-2 px-6 mb-12 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`font-body text-xs tracking-[0.2em] uppercase px-6 py-2 border transition-all duration-300 ${
              activeCategory === cat.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="group relative overflow-hidden aspect-[4/3] cursor-pointer border border-border"
              onClick={() => setLightbox(item)}
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Search size={28} className="text-primary mb-3" />
                <p className="font-display text-xl text-foreground text-center px-4">{item.title}</p>
                {item.description && (
                  <p className="font-body text-xs text-muted-foreground text-center px-6 mt-2">{item.description}</p>
                )}
              </div>
              {item.featured && (
                <div className="absolute top-3 left-3">
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-2 py-1">Featured</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground">No items in this category yet.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightbox.image_url} alt={lightbox.title} className="w-full max-h-[70vh] object-contain" />
            <div className="mt-4 text-center">
              <p className="font-display text-2xl text-foreground">{lightbox.title}</p>
              {lightbox.description && (
                <p className="font-body text-sm text-muted-foreground mt-1">{lightbox.description}</p>
              )}
              <button
                onClick={() => setLightbox(null)}
                className="mt-4 font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <Footer />
      <CostCalculator />
    </div>
  );
}

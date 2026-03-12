// app/routes/home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api-service";
import authService from "../services/auth.service";
import Loading from "../components/ui/loading";
import type { Destination } from "../services/destination.types";
import { ROUTES } from "../config/routes-config";
import { useHydrated } from "../hooks/useHydrated";

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  accent: string;
}

function CountUp({
  end,
  suffix = "",
  duration = 1800,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const startTime = performance.now();
    let raf = 0;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(end * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return (
    <>
      {count.toLocaleString()}
      {suffix}
    </>
  );
}

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.get<{ destinations: Destination[] }>("/destinations", {
          params: {
            featured: true,
            limit: 6,
            status: "approved",
          },
        });
        setDestinations(response.destinations || []);
      } catch (err) {
        setError("Failed to load destinations. Please try again later.");
        console.error("Error fetching destinations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const syncUser = () => setUser(authService.getCurrentUser() || null);
    syncUser();

    window.addEventListener("authChange", syncUser as EventListener);
    return () => {
      window.removeEventListener("authChange", syncUser as EventListener);
    };
  }, [hydrated]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    window.location.reload();
  };

  const stats = useMemo<StatItem[]>(
    () => [
      { label: "Verified Guides", value: 50, suffix: "+", accent: "text-uganda-yellow" },
      { label: "Destinations", value: 100, suffix: "+", accent: "text-white" },
      { label: "Happy Travelers", value: 5000, suffix: "+", accent: "text-uganda-red" },
      { label: "Satisfaction Rate", value: 98, suffix: "%", accent: "text-uganda-yellow" },
    ],
    []
  );

  return (
    <div className="min-h-screen overflow-hidden bg-white text-uganda-black">
      {/* Hero */}
      <section className="relative isolate -mt-px overflow-hidden border-b-4 border-uganda-red bg-[linear-gradient(135deg,#ffcf33_0%,#FFC107_45%,#f4ac00_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.12),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(227,24,55,0.22),transparent_20%),linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-uganda-red/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-uganda-black/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-15" />

        <div className="relative container mx-auto grid min-h-[calc(100vh-76px)] items-center gap-12 px-4 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/35 px-4 py-2 backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.12)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-uganda-black text-lg font-extrabold text-uganda-yellow shadow-lg shadow-black/20 animate-bounce">
                JT
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-uganda-black/70">Explore Uganda</p>
                <p className="text-xl font-black text-uganda-black">
                  Jumuiya<span className="text-white">Tours</span>
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <span className="rounded-full border border-uganda-black/10 bg-white/45 px-4 py-2 text-sm font-semibold text-uganda-black backdrop-blur-sm">
                🇺🇬 Local Guides
              </span>
              <span className="rounded-full border border-uganda-red/20 bg-uganda-red/10 px-4 py-2 text-sm font-semibold text-uganda-black backdrop-blur-sm">
                Wildlife • Culture • Adventure
              </span>
            </div>

            <h1 className="text-4xl font-black leading-tight text-uganda-black sm:text-5xl lg:text-7xl">
              Discover Uganda&apos;s
              <span className="mt-3 block">
                <span className="inline-flex items-center rounded-[2rem] bg-uganda-black px-5 py-2 text-white shadow-2xl shadow-black/15">
                  Hidden Gems
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-uganda-black/80 lg:mx-0 lg:text-xl">
              Experience vibrant Ugandan adventures with verified local guides, unforgettable safaris,
              cultural encounters, and destination stories crafted in the colors of the Pearl of Africa.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap lg:items-start">
              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-white/35 bg-white/35 px-5 py-3 text-uganda-black backdrop-blur-xl shadow-lg">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-uganda-black font-black text-uganda-yellow">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-semibold">Welcome back, {user.name}!</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={ROUTES.dashboards.base}
                      className="rounded-full bg-uganda-black px-7 py-3 font-bold text-white shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-1 hover:bg-uganda-red"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="rounded-full border border-uganda-black/20 px-7 py-3 font-bold text-uganda-black transition duration-300 hover:-translate-y-1 hover:bg-white"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.auth.register}
                    className="rounded-full bg-uganda-black px-8 py-4 text-lg font-bold text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-uganda-red"
                  >
                    Start Your Adventure
                  </Link>
                  <Link
                    to={ROUTES.auth.login}
                    className="rounded-full border border-uganda-black/20 bg-white/40 px-8 py-4 text-lg font-bold text-uganda-black transition duration-300 hover:-translate-y-1 hover:bg-white"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                to={ROUTES.destinations.list}
                className="group inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 font-semibold text-uganda-black shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-uganda-black hover:text-white"
              >
                <span className="text-xl group-hover:animate-bounce">🏞️</span>
                Explore Destinations
              </Link>
              <Link
                to={ROUTES.bookings.create}
                className="group inline-flex items-center gap-3 rounded-full bg-white/45 px-5 py-3 font-semibold text-uganda-black backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white"
              >
                <span className="text-xl group-hover:animate-bounce">📅</span>
                Book a Tour
              </Link>
              <Link
                to={ROUTES.guides.list}
                className="group inline-flex items-center gap-3 rounded-full bg-uganda-black px-5 py-3 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-uganda-red"
              >
                <span className="text-xl group-hover:animate-bounce">👨‍🏫</span>
                Find Guides
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -top-6 left-6 rounded-2xl border border-white/25 bg-white/35 px-4 py-3 text-sm font-semibold text-uganda-black backdrop-blur-xl shadow-xl animate-bounce [animation-duration:3.4s]">
              ✨ Trusted local experts
            </div>
            <div className="absolute -bottom-4 right-6 rounded-2xl border border-uganda-red/20 bg-uganda-red/10 px-4 py-3 text-sm font-semibold text-uganda-black backdrop-blur-xl shadow-xl animate-bounce [animation-duration:3.8s]">
              ❤️ Culture-rich experiences
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-white/30 p-4 shadow-[0_35px_90px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_35%,rgba(227,24,55,0.14))]" />
              <img
                src={destinations[0]?.images?.[0] || "/images/uganda-placeholder.jpg"}
                alt={destinations[0]?.name || "Uganda landscape"}
                className="h-[420px] w-full rounded-[1.5rem] object-cover"
              />
              <div className="absolute inset-x-8 bottom-8 rounded-[1.5rem] border border-white/20 bg-black/55 p-5 text-white backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-uganda-yellow px-3 py-1 text-xs font-black uppercase tracking-wide text-uganda-black">
                    Featured Escape
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    Pearl of Africa
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {destinations[0]?.name || "Bwindi Impenetrable Forest"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {destinations[0]?.short_description ||
                    "Gorilla trekking, golden horizons, and story-rich adventures wrapped in Uganda’s natural beauty."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/85">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                    {destinations[0]?.region || "Western Uganda"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                    {destinations[0]?.price_range || "$1000 - $2000"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="relative bg-white py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-uganda-yellow/15 px-4 py-2 text-sm font-bold text-uganda-black">
              Crafted with Ugandan spirit
            </span>
            <h2 className="mt-4 text-3xl font-black text-uganda-black sm:text-5xl">
              Why Choose Jumuiya Tours?
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              We blend local expertise, verified trust, and a premium booking experience with a bold,
              modern visual identity inspired by the Ugandan flag.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: "🗺️",
                title: "Local Expertise",
                text: "Verified local guides unlock hidden gems, community stories, and authentic adventures beyond the usual trail.",
                accent: "from-uganda-yellow/30 to-white",
              },
              {
                icon: "✅",
                title: "Verified Guides",
                text: "Every guide goes through screening and review, so every journey feels secure, polished, and confidence-inspiring.",
                accent: "from-uganda-red/20 to-white",
              },
              {
                icon: "💳",
                title: "Easy Booking",
                text: "Smooth online booking, fast decision-making, and well-curated trip planning that feels modern and effortless.",
                accent: "from-uganda-black/10 to-white",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70`} />
                <div className="relative">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-uganda-yellow text-3xl shadow-lg transition duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-black text-uganda-black">{item.title}</h3>
                  <p className="mt-4 leading-8 text-gray-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured destinations */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#f9f7ef_100%)] py-20">
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-uganda-yellow/20 blur-3xl" />
        <div className="absolute left-0 bottom-10 h-64 w-64 rounded-full bg-uganda-red/10 blur-3xl" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="mb-12 flex flex-col items-center justify-between gap-4 text-center lg:flex-row lg:text-left">
            <div>
              <span className="inline-flex rounded-full border border-uganda-yellow/30 bg-white px-4 py-2 text-sm font-bold text-uganda-black shadow-sm">
                Handpicked escapes
              </span>
              <h2 className="mt-4 text-3xl font-black text-uganda-black sm:text-5xl">
                Featured Destinations
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                Discover Uganda&apos;s most breathtaking places presented with richer cards, sharper contrast,
                and a more premium travel vibe.
              </p>
            </div>
            <Link
              to={ROUTES.destinations.list}
              className="inline-flex items-center gap-3 rounded-full bg-uganda-black px-7 py-4 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-uganda-red"
            >
              View All Destinations
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center rounded-[2rem] border border-black/5 bg-white/70 py-20 backdrop-blur-sm">
              <Loading text="Loading amazing destinations..." />
            </div>
          ) : error ? (
            <div className="mx-auto max-w-xl rounded-[1.5rem] border border-red-200 bg-red-50 px-6 py-5 text-center text-red-700 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          ) : destinations.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-[1.75rem] border border-uganda-yellow/25 bg-white px-6 py-10 text-center shadow-lg">
              <div className="text-4xl">🔍</div>
              <h3 className="mt-4 text-2xl font-black text-uganda-black">No Featured Destinations Yet</h3>
              <p className="mt-3 text-gray-600">Check back soon for a curated drop of unforgettable places.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {destinations.map((destination, index) => (
                <div
                  key={destination.id}
                  className="group overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(15,23,42,0.16)]"
                >
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
                    <img
                      src={destination.images?.[0] || "/images/uganda-placeholder.jpg"}
                      alt={destination.name}
                      className="h-60 w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-uganda-yellow px-3 py-1 text-xs font-black uppercase tracking-wide text-uganda-black shadow-md">
                      Featured
                    </div>
                    <div className="absolute bottom-4 left-4 z-20 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
                      #{index + 1} Must Visit
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black text-uganda-black transition duration-300 group-hover:text-uganda-red">
                          {destination.name}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-gray-600">
                          {destination.short_description || destination.description?.substring(0, 130)}...
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 flex items-center justify-between gap-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                        {destination.region || "Uganda"}
                      </span>
                      <span className="text-sm font-black text-uganda-red">
                        {destination.price_range || "Custom quote"}
                      </span>
                    </div>

                    <Link
                      to={ROUTES.destinations.detail(destination.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-uganda-yellow px-6 py-3 font-bold text-uganda-black shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-uganda-black hover:text-white"
                    >
                      Explore Destination
                      <span>↗</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden border-y-4 border-uganda-yellow bg-uganda-black py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,193,7,0.15),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(227,24,55,0.18),transparent_25%)]" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 px-6 py-8 text-center backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                <div className={`text-4xl font-black sm:text-5xl ${stat.accent}`}>
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#FFC107_0%,#ffcf33_35%,#ffc107_65%,#f3b400_100%)] py-20">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-60 w-60 rounded-full bg-uganda-red/20 blur-3xl" />
        <div className="relative container mx-auto px-4 text-center lg:px-8">
          <span className="inline-flex rounded-full border border-uganda-black/10 bg-white/50 px-4 py-2 text-sm font-bold text-uganda-black backdrop-blur-sm">
            Ready when you are
          </span>
          <h2 className="mt-4 text-3xl font-black text-uganda-black sm:text-5xl">
            Ready for Your Ugandan Adventure?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-uganda-black/80">
            Join thousands of travelers exploring the beauty of Uganda through trusted guides,
            curated destinations, and a platform that now looks as premium as the journey itself.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            {!user && (
              <Link
                to={ROUTES.auth.register}
                className="rounded-full bg-uganda-black px-8 py-4 text-lg font-bold text-uganda-yellow shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-uganda-black"
              >
                Create Your Account
              </Link>
            )}
            <Link
              to={ROUTES.destinations.list}
              className="rounded-full border-2 border-uganda-black px-8 py-4 text-lg font-bold text-uganda-black transition duration-300 hover:-translate-y-1 hover:bg-uganda-black hover:text-white"
            >
              Browse All Destinations
            </Link>
          </div>

          <p className="mt-6 text-sm font-semibold text-uganda-black/70">
            No commitment required • Free cancellation • Best price guarantee
          </p>
        </div>
      </section>
    </div>
  );
}

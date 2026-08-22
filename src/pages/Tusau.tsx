import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Heart } from "lucide-react";

const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const Divider = () => (
  <div className="flex items-center justify-center py-8 opacity-60">
    <div className="h-px w-16 bg-primary/40" />
    <Heart className="mx-4 text-primary/60" size={16} strokeWidth={1.5} />
    <div className="h-px w-16 bg-primary/40" />
  </div>
);

const Tusau = () => {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState("Әрине, келемін");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Рахмет! Сіздің жауабыңыз қабылданды.");
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex justify-center font-sans text-[#4a4a4a]">
      <div className="w-full max-w-[480px] bg-white shadow-2xl shadow-primary/10 min-h-screen relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-secondary/40 to-transparent pointer-events-none" />

        <div className="px-6 py-12 relative z-10">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs tracking-[0.2em] uppercase text-primary mb-4 font-medium">
                Тұсаукесер тойы
              </p>
              <h1 className="font-serif text-5xl md:text-6xl text-[#3d3d3d] mb-8 font-medium tracking-tight">
                АҚЖІБЕК
              </h1>

              <div className="mx-auto w-64 h-80 rounded-t-full rounded-b-[40px] border-4 border-secondary p-2 shadow-lg mb-8">
                <div className="w-full h-full rounded-t-full rounded-b-[32px] overflow-hidden bg-[#f5ebe0] relative">
                  <img
                    src="https://picsum.photos/seed/babygirl/400/500"
                    alt="Ақжібек"
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                </div>
              </div>
            </div>
          </FadeIn>

          <Divider />

          <FadeIn>
            <div className="text-center my-10 px-2">
              <h2 className="font-serif text-xl md:text-2xl text-[#3d3d3d] mb-6 leading-relaxed">
                Құрметті ағайын-туыс, бауырлар, нағашы-жиен, бөлелер, құда-жекжат,
                дос-жарандар!
              </h2>
              <p className="text-sm leading-loose text-[#6b6b6b] font-light">
                Сіздерді сүйікті қызымыз
                <span className="font-medium text-primary"> АҚЖІБЕКТІҢ</span>{" "}
                тұсаукесер тойына арнайы жайылған ақ дастарханымыздың қадірлі
                қонағы болуға шақырамыз!
              </p>
            </div>
          </FadeIn>

          <Divider />

          <FadeIn>
            <div className="my-10">
              <div className="text-center mb-6">
                <h3 className="font-serif text-2xl text-[#3d3d3d]">Наурыз 2026</h3>
              </div>

              <div className="bg-[#fdfbf7] rounded-2xl p-6 border border-secondary/50 shadow-sm">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-[#a3a3a3] mb-4">
                  <div>Дс</div>
                  <div>Сс</div>
                  <div>Ср</div>
                  <div>Бс</div>
                  <div>Жм</div>
                  <div>Сн</div>
                  <div>Жк</div>
                </div>
                <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-sm">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    const isTarget = day === 29;
                    return (
                      <div key={day} className="flex justify-center items-center">
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-full ${
                            isTarget
                              ? "bg-primary text-white shadow-md font-medium"
                              : "text-[#4a4a4a]"
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </FadeIn>

          <Divider />

          <FadeIn>
            <div className="text-center my-10">
              <h3 className="font-serif text-3xl text-primary mb-6">
                29 / 03 / 2026 Ж.
              </h3>
              <div className="space-y-4 text-sm text-[#6b6b6b] font-light">
                <p>
                  <span className="font-medium text-[#4a4a4a]">17:00</span> -
                  Қонақтардың жиналуы
                </p>
                <p>
                  <span className="font-medium text-[#4a4a4a]">18:00</span> - Тойдың
                  басталуы
                </p>
              </div>
            </div>
          </FadeIn>

          <Divider />

          <FadeIn>
            <div className="text-center my-10">
              <h3 className="font-serif text-2xl text-[#3d3d3d] mb-4">
                Мекен-жайымыз:
              </h3>
              <p className="text-lg text-[#6b6b6b] mb-8">Егемендік 8193</p>

              <a
                href="https://2gis.kz/almaty/geo/70000001088189529"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#f5ebe0] hover:bg-[#e3d5ca] text-[#4a4a4a] px-8 py-4 rounded-full transition-colors duration-300 shadow-sm"
              >
                <MapPin size={18} className="text-primary" />
                <span className="font-medium text-sm tracking-wide uppercase">
                  Картадан көру
                </span>
              </a>
            </div>
          </FadeIn>

          <Divider />

          <FadeIn>
            <div className="text-center my-10">
              <p className="text-sm text-[#a3a3a3] uppercase tracking-widest mb-3">
                Той иелері
              </p>
              <h3 className="font-serif text-2xl text-[#3d3d3d]">
                Дінмұхаммед – Әйгерім
              </h3>
            </div>
          </FadeIn>

          <Divider />

          <FadeIn>
            <div className="my-10 bg-[#fdfbf7] rounded-3xl p-8 border border-secondary/50 shadow-sm">
              <h3 className="font-serif text-xl text-center text-[#3d3d3d] mb-8 leading-relaxed">
                Құрметті қонақтар! Тойға келетіндеріңізді растауларыңызды сұраймыз!
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Есіміңіз"
                    className="w-full bg-white border border-[#e3d5ca] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-[#a3a3a3]"
                  />
                </div>

                <div className="space-y-3">
                  {["Әрине, келемін", "Жұбайыммен келемін", "Келе алмаймын"].map(
                    (option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[#e3d5ca] bg-white cursor-pointer hover:border-primary transition-colors"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            attendance === option
                              ? "border-primary"
                              : "border-primary/50"
                          }`}
                        >
                          {attendance === option && (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name="attendance"
                          value={option}
                          checked={attendance === option}
                          onChange={(e) => setAttendance(e.target.value)}
                          className="hidden"
                        />
                        <span className="text-sm text-[#4a4a4a]">{option}</span>
                      </label>
                    ),
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-[#c89765] text-white py-4 rounded-xl font-medium text-sm tracking-wide uppercase transition-colors shadow-md shadow-primary/20 mt-4"
                >
                  Жауап беру
                </button>
              </form>
            </div>
          </FadeIn>

          <div className="text-center mt-16 mb-8 opacity-50">
            <p className="text-xs font-serif">Ақжібек • 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tusau;


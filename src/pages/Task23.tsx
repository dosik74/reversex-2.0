import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Task23 = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/tasks/22">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Тапсырма 23</h1>
            <Link to="/tasks/24">
              <Button variant="ghost" size="sm">
                Дальше
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {[20, 21, 22, 23, 24, 25].map((num) => (
              <Link key={num} to={`/tasks/${num}`}>
                <Button 
                  variant={num === 23 ? "default" : "outline"} 
                  size="sm"
                >
                  {num}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 card-glow mb-8">
          <h2 className="text-3xl font-bold mb-2">Диаграмма сөйлейді</h2>
          <p className="text-muted-foreground text-lg">
            5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
          </p>
        </Card>

        <Card className="p-6 mb-6 border-l-4 border-primary">
          <h3 className="text-xl font-bold mb-4">📌 Мақсаты</h3>
          <p className="text-foreground leading-relaxed">
            Диаграмма, график және сызбалар бойынша ақпарат оқу, түсіну және түйіндеуге үйрету.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📖 Өткізу барысы</h3>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Оқушыларға диаграмма, график, сызба беріледі.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Диаграмманың құрылымын, назарын ортасын анықтау.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Диаграмма бойынша сұрақтарға жауап беру және өз пайымдарын білдіру.</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">✅ Күтілетін нәтижелер</h3>
          <p className="text-foreground leading-relaxed">
            Оқушы диаграмма, график және сызбалар бойынша ақпарат оқи біліп, түсіне түбінің түйіндей алады.
          </p>
        </Card>

        <Card className="p-8 bg-muted">
          <h4 className="text-lg font-semibold mb-6">📊 Диаграмма түрлері:</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">📈 Сызықтық график</p>
              <p className="text-sm text-muted-foreground">Өзгерісі мен қарым-қатынасты көрсетеді</p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">📊 Баған диаграммасы</p>
              <p className="text-sm text-muted-foreground">Мөлшерлерді салыстырады</p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">🥧 Сектор диаграммасы</p>
              <p className="text-sm text-muted-foreground">Бөлік үлестерін көрсетеді</p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">📍 Сызба</p>
              <p className="text-sm text-muted-foreground">Құрылымды ұқсатады</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-6 flex justify-between">
          <Link to="/tasks/22">
            <Button variant="outline">← Алдыңғы</Button>
          </Link>
          <Link to="/tasks/24">
            <Button>Келесі →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Task23;

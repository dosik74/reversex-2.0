import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Task25 = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/tasks/24">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Тапсырма 25</h1>
            <div />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {[20, 21, 22, 23, 24, 25].map((num) => (
              <Link key={num} to={`/tasks/${num}`}>
                <Button 
                  variant={num === 25 ? "default" : "outline"} 
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
          <h2 className="text-3xl font-bold mb-2">Ынамдық кеспетті тану</h2>
          <p className="text-muted-foreground text-lg">
            5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
          </p>
        </Card>

        <Card className="p-6 mb-6 border-l-4 border-primary">
          <h3 className="text-xl font-bold mb-4">📌 Мақсаты</h3>
          <p className="text-foreground leading-relaxed">
            Динамикалық кеспетті оқу, түсіну және талдау арқылы функционалдық оқу сауаттылығын дамыту.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📖 Өткізу барысы</h3>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Оқушыларға әр түрлі динамикалық кеспет беріледі.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Кеспеттің құрылымын, мәнін және өзгерісін түсіну.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Кеспеттің негізінде берілген ақпаратты өндіктеп, сорысарын бөліседі.</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">✅ Күтілетін нәтижелер</h3>
          <p className="text-foreground leading-relaxed">
            Оқушы динамикалық кеспет бойынша ақпарат оқи біліп, өндіктеп түсіне біліп, дұрыс қорытындысын жасай алады.
          </p>
        </Card>

        <Card className="p-8 bg-muted">
          <h4 className="text-lg font-semibold mb-6">📊 Динамикалық кеспеттің құрамы:</h4>
          <div className="space-y-4">
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">🎯 Атауы</p>
              <p className="text-sm text-muted-foreground">Кеспеттің тақырыбы және мақсаты</p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">📈 Өндік</p>
              <p className="text-sm text-muted-foreground">Кеспеттің көлемі, соңы, ағымы</p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">⏱️ Уақыт</p>
              <p className="text-sm text-muted-foreground">Уақыт аралығы және өндіктік</p>
            </div>
            <div className="bg-background p-4 rounded border border-border">
              <p className="font-semibold mb-2">📝 Түсіндіру</p>
              <p className="text-sm text-muted-foreground">Кеспеттің мәні және болмасы</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-6 flex justify-between">
          <Link to="/tasks/24">
            <Button variant="outline">← Алдыңғы</Button>
          </Link>
          <Link to="/">
            <Button>Басты бетке → </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Task25;

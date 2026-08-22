import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Task22 = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/tasks/21">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Тапсырма 22</h1>
            <Link to="/tasks/23">
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
                  variant={num === 22 ? "default" : "outline"} 
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
          <h2 className="text-3xl font-bold mb-2">Нұсқаулықпен жұмыс</h2>
          <p className="text-muted-foreground text-lg">
            5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
          </p>
        </Card>

        <Card className="p-6 mb-6 border-l-4 border-primary">
          <h3 className="text-xl font-bold mb-4">📌 Мақсаты</h3>
          <p className="text-foreground leading-relaxed">
            Нұсқаулықты оқы білу, түсіну және орындау арқылы функционалдық оқу сауаттылығын дамыту.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📖 Өткізу барысы</h3>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Оқушыларға әр түрлі нұсқаулықтар беріледі.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Нұсқаулықты ретімен оқу, ең бірінші, екінші, үшінші қадамдарын аңғарту.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Нұсқаулықтың әр бөлігін түсіну және сәйкес орындау.</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">✅ Күтілетін нәтижелер</h3>
          <p className="text-foreground leading-relaxed">
            Оқушы нұсқаулықты сәйкес оқи біледі және бер болған тапсырманы дұрыс орындай алады.
          </p>
        </Card>

        <Card className="p-6 bg-muted">
          <h4 className="text-lg font-semibold mb-4">📋 Нұсқаулық құрамы:</h4>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span><strong>Атауы:</strong> Нұсқаулықтың тақырыбы</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span><strong>Мақсаты:</strong> Нұсқаулықпен не істейтіндігі</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span><strong>Құралдары:</strong> Не қажет екендігі</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span><strong>Қадамдары:</strong> Ретімен орындау</span>
            </li>
          </ol>
        </Card>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-6 flex justify-between">
          <Link to="/tasks/21">
            <Button variant="outline">← Алдыңғы</Button>
          </Link>
          <Link to="/tasks/23">
            <Button>Келесі →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Task22;

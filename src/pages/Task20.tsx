import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Task20 = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Тапсырма 20</h1>
            <Link to="/tasks/21">
              <Button variant="ghost" size="sm">
                Дальше
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {/* Navigation between tasks */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[20, 21, 22, 23, 24, 25].map((num) => (
              <Link key={num} to={`/tasks/${num}`}>
                <Button 
                  variant={num === 20 ? "default" : "outline"} 
                  size="sm"
                >
                  {num}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 card-glow mb-8">
          <h2 className="text-3xl font-bold mb-2">Күнтізбені оқимын</h2>
          <p className="text-muted-foreground text-lg">
            5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
          </p>
        </Card>

        {/* Purpose Section */}
        <Card className="p-6 mb-6 border-l-4 border-primary">
          <h3 className="text-xl font-bold mb-4">📌 Мақсаты</h3>
          <p className="text-foreground leading-relaxed">
            Күнтізбе түріндегі ақпаратты оқып, түсінуге үйрету.
          </p>
        </Card>

        {/* Process Section */}
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📖 Өткізу барысы</h3>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Оқушыларға айлық күнтізбе беріледі.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Күнтізбеге ерекше назар аударып, күн, аптасы, айы жөнінде сұрақ қойылады.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Күнтізбеде берілген ақпаратын пайдаланып, сұрақтарға жауап беруге тырысса тәрбиеленетін оқушы өз пікірін бөліседі.</span>
            </li>
          </ul>
        </Card>

        {/* Expected Results Section */}
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">✅ Күтілетін нәтижелер</h3>
          <p className="text-foreground leading-relaxed">
            Оқушы күнтізбе түріндегі ақпаратты дұрыс оқи білу және түсіне білуге құрал боламыз.
          </p>
        </Card>

        {/* Calendar Placeholder */}
        <Card className="p-12 text-center mb-8 bg-muted">
          <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded">
            <p className="text-muted-foreground">📅 Күнтізбе ресимі өрнегі</p>
          </div>
        </Card>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-6 flex justify-between">
          <Link to="/">
            <Button variant="outline">← Басты бет</Button>
          </Link>
          <Link to="/tasks/21">
            <Button>Келесі тапсырма →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Task20;

import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PlaceholderPage = ({ title, icon: Icon }: { title: string; icon: any }) => {
  return (
    <div className="container mx-auto px-4 py-16">
      <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors inline-block mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Movies
      </Link>

      <Card className="p-12 text-center card-glow">
        <Icon className="w-24 h-24 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl font-bold mb-4 gradient-text">{title}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Coming soon! This section is under development.
        </p>
        <p className="text-muted-foreground">
          We're working hard to bring you tracking for {title.toLowerCase()}.
          <br />
          Stay tuned for updates!
        </p>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
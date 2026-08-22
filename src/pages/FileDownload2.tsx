import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const FileDownload2 = () => {
  const fileName = "BD -INABAT.qst";
  const fileSize = "45 KB";
  const fileDescription = "BD -INABAT Question Set";

  const handleDownload = () => {
    // Use window.location for proper file download
    window.location.href = `/BD%20-INABAT.qst`;
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors inline-block mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back Home
      </Link>

      <div className="max-w-2xl mx-auto">
        <Card className="p-12 text-center card-glow">
          <FileText className="w-24 h-24 mx-auto mb-6 text-primary" />
          
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            {fileDescription}
          </h1>
          
          <div className="bg-secondary/50 rounded-lg p-6 mb-8 border border-primary/20">
            <p className="text-muted-foreground mb-2">File Name</p>
            <p className="text-xl font-mono font-semibold mb-4">{fileName}</p>
            
            <p className="text-muted-foreground mb-2">File Size</p>
            <p className="text-lg font-semibold mb-6">{fileSize}</p>

            <p className="text-muted-foreground text-sm">
              This file contains question set resources. Access only via direct link.
            </p>
          </div>

          <Button 
            onClick={handleDownload}
            size="lg"
            className="gap-2 px-8 h-12 text-base"
          >
            <Download className="w-5 h-5" />
            Download File
          </Button>

          <p className="text-muted-foreground text-sm mt-8">
            Click the button above to download the file to your device.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default FileDownload2;

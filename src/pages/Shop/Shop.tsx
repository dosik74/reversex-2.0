import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
  specs: {
    gpu: string;
    cpu: string;
    motherboard: string;
    ram: string;
    psu: string;
  };
  images: string[];
}

const products: Product[] = [
  {
    id: 1,
    name: 'RX 580 Gaming PC',
    price: 90000,
    specs: {
      gpu: 'RX 580 4GB',
      cpu: 'Xeon E5-2670v2',
      motherboard: 'X79',
      ram: '16GB DDR3',
      psu: '500W PC Cooler',
    },
    images: [
  '/video-for my success market/IMG_20260208_033311.jpg.jpeg',
  '/video-for my success market/IMG_20260208_033600.jpg.jpeg',
  '/video-for my success market/unnamed (1).jpg',
  '/video-for my success market/unnamed (2).jpg',
  'https://youtube.com/shorts/w3CnHs17lL8?feature=share',
  'https://youtu.be/28ZOeN9OusQ',
],
},
];

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-text">🛒 SHOP</h1>
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/shop/${product.id}`}
            className="group"
          >
            <div className="h-fit bg-card border border-border rounded-lg overflow-hidden hover-lift card-glow">
              {/* Product Image */}
              <div className="aspect-[3/4] bg-muted overflow-hidden relative">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  В наличии
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>

                {/* Specs */}
                <div className="text-xs text-muted-foreground mb-3 space-y-1">
                  <p>🎮 {product.specs.gpu}</p>
                  <p>🖥️ {product.specs.cpu}</p>
                  <p>💾 {product.specs.ram}</p>
                </div>

                {/* Price */}
                <div className="text-2xl font-bold gradient-text mb-4">
                  ₸ {product.price.toLocaleString()}
                </div>

                {/* CTA */}
                <Button className="w-full gap-2" onClick={(e) => {
                  e.preventDefault();
                }}>
                  <ShoppingCart className="w-4 h-4" />
                  Посмотреть
                </Button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Товары не найдены</p>
        </div>
      )}
    </div>
  );
}

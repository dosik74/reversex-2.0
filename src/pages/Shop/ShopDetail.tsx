import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShoppingCart, Phone, MessageCircle, Mail, ArrowLeft, Play, Send } from 'lucide-react';

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
  description?: string;
}

const products: Record<number, Product> = {
  1: {
    id: 1,
    name: 'RX 580 Gaming PC',
    price: 90000,
    specs: {
      gpu: 'RX 580 8GB',
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
    description: 'Мощный игровой компьютер для современных игр и приложений',
  },
};

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cart, setCart] = useState(0);
  const [mainImage, setMainImage] = useState(0);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  const productId = parseInt(id || '1');
  const product = products[productId];

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
        <Button onClick={() => navigate('/shop')}>Вернуться в магазин</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    setCart(cart + 1);
    alert(`✅ Добавлено в корзину! (${cart + 1} товаров)`);
  };

  const handlePhoneCall = () => {
    window.location.href = 'tel:+87752570646';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/87752570646', '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:shop@reversex.kz';
  };

  const handleOrder = () => {
    setShowOrderDialog(true);
  };

  const isVideo = (url: string) => url.toLowerCase().endsWith('.mp4');

  const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

  const extractYouTubeId = (url: string) => {
    const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => navigate('/shop')}
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в магазин
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images Section */}
        <div className="flex flex-col gap-4">
          {/* Main Image/Video */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border relative">
            {isYouTube(product.images[mainImage]) ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${extractYouTubeId(product.images[mainImage])}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isVideo(product.images[mainImage]) ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/80">
                <a 
                  href={product.images[mainImage]} 
                  download
                  className="flex flex-col items-center gap-4 hover:opacity-80 transition"
                >
                  <Play className="w-16 h-16 text-accent fill-accent" />
                  <span className="text-white text-center px-4">
                    Нажми чтобы скачать видео
                  </span>
                </a>
              </div>
            ) : (
              <img
                src={product.images[mainImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setMainImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative group ${
                    mainImage === index
                      ? 'border-primary'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {isYouTube(image) ? (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(image)}/default.jpg`}
                        alt={`YouTube thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </>
                  ) : isVideo(image) ? (
                    <>
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary fill-primary" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground mb-2">{product.description}</p>
            )}
            <div className="inline-block bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-semibold">
              ✓ В наличии
            </div>
          </div>

          {/* Price */}
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-2">Цена:</p>
            <p className="text-4xl font-bold gradient-text">₸ {product.price.toLocaleString()}</p>
          </div>

          {/* Specs */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Характеристики:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">GPU</p>
                <p className="font-semibold">{product.specs.gpu}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="font-semibold">{product.specs.cpu}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Платформа</p>
                <p className="font-semibold">{product.specs.motherboard}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">ОЗУ</p>
                <p className="font-semibold">{product.specs.ram}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg col-span-2">
                <p className="text-sm text-muted-foreground">БП</p>
                <p className="font-semibold">{product.specs.psu}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Способы оплаты:</h3>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-2 bg-accent/10 rounded-lg text-sm font-medium">
                💳 Kaspi Рассрочка
              </div>
              <div className="px-3 py-2 bg-accent/10 rounded-lg text-sm font-medium">
                🔴 Kaspi Red
              </div>
              <div className="px-3 py-2 bg-accent/10 rounded-lg text-sm font-medium">
                🏦 Кредит
              </div>
            </div>
          </div>

          {/* FPS в играх */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 gradient-text">🎮 FPS в играх</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                <span className="text-sm">Cyberpunk 2077</span>
                <span className="font-bold text-accent">60+ FPS</span>
              </div>
              <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                <span className="text-sm">Starfield</span>
                <span className="font-bold text-accent">70+ FPS</span>
              </div>
              <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                <span className="text-sm">GTA 5</span>
                <span className="font-bold text-accent">85+ FPS</span>
              </div>
              <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                <span className="text-sm">Fortnite</span>
                <span className="font-bold text-accent">100+ FPS</span>
              </div>
              <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                <span className="text-sm">Valorant</span>
                <span className="font-bold text-accent">120+ FPS</span>
              </div>
              <div className="bg-card/50 rounded-lg p-3">
                <p className="text-sm font-semibold text-accent mb-1">CS:2</p>
                <p className="text-xs text-muted-foreground">120+ FPS • До 200 стабильных</p>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary">📝 Полное описание</h3>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                💻 <span className="text-accent font-semibold">Xeon E5-2670v2 с 10 ядрами</span> - зверь для многозадачности: рендер, кодинг, даже виртуалки. Справляется со всем без проблем.
              </p>
              <p>
                🎮 <span className="text-accent font-semibold">RX 580 8GB</span> тянет игры в 1080p на высоких: GTA, Cyberpunk и много других. Отличная производительность для своей цены.
              </p>
              <p>
                🖥️ <span className="text-accent font-semibold">16GB DDR3</span> хватает для всего. X79 платформа надёжная, легко апгрейдить в случае необходимости.
              </p>
              <p>
                ⚡ <span className="text-accent font-semibold">БП 500W</span> стабильный и тихий. Запас мощности для комфортной работы.
              </p>
              <p className="text-base text-accent font-semibold">
                ✨ Бюджетный вариант для геймера или фрилансера - служит годами! Цена огонь, бери не думай!
              </p>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 gradient-text">🚚 Доставка</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-card/50 rounded-lg p-3">
                <span className="text-xl">🎁</span>
                <div>
                  <p className="font-semibold text-sm text-accent">Бесплатная доставка в Алматы</p>
                  <p className="text-xs text-muted-foreground">Доставим за 3 часа</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card/50 rounded-lg p-3">
                <span className="text-xl">🇰🇿</span>
                <div>
                  <p className="font-semibold text-sm text-accent">Доставка в другие города</p>
                  <p className="text-xs text-muted-foreground">Свяжись с нами для расчёта стоимости</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Добавить в корзину ({cart})
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full font-bold"
              onClick={handleOrder}
            >
              🛍️ Заказать сейчас
            </Button>
          </div>

          {/* Contact Section */}
          <div className="bg-card border border-border rounded-lg p-6 pt-4">
            <h3 className="text-lg font-semibold mb-4">📞 Свяжись с нами</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePhoneCall}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">Позвонить</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="border-primary/30 bg-gradient-to-b from-card to-card/80">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text text-center mb-2">
              🎮 Оформить заказ
            </DialogTitle>
            <p className="text-center text-muted-foreground text-sm mt-2">
              Выбери удобный способ связи с нами
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 mt-6">
            {/* WhatsApp */}
            <Button
              size="lg"
              onClick={() => {
                window.open('https://wa.me/87752570646', '_blank');
                setShowOrderDialog(false);
              }}
              className="h-auto py-4 gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span>WhatsApp</span>
                <span className="text-xs font-normal opacity-90">Быстрый ответ</span>
              </div>
            </Button>

            {/* Telegram */}
            <Button
              size="lg"
              onClick={() => {
                window.open('https://t.me/dosikedit', '_blank');
                setShowOrderDialog(false);
              }}
              className="h-auto py-4 gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span>Telegram</span>
                <span className="text-xs font-normal opacity-90">@dosikedit</span>
              </div>
            </Button>

            {/* Instagram */}
            <Button
              size="lg"
              onClick={() => {
                window.open('https://instagram.com/dosikte', '_blank');
                setShowOrderDialog(false);
              }}
              className="h-auto py-4 gap-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-xl">📸</span>
              <div className="flex flex-col items-start">
                <span>Instagram</span>
                <span className="text-xs font-normal opacity-90">@dosikte</span>
              </div>
            </Button>

            {/* Phone */}
            <Button
              size="lg"
              onClick={() => {
                window.location.href = 'tel:+87752570646';
                setShowOrderDialog(false);
              }}
              className="h-auto py-4 gap-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              <Phone className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span>Позвонить</span>
                <span className="text-xs font-normal opacity-90">+7 (775) 257-06-46</span>
              </div>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Мы ответим быстро и поможем с заказом! 💚
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

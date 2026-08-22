import React, { useEffect } from 'react';
import './ProfileCard.css';

const ProfileCard: React.FC = () => {
  useEffect(() => {
    // Animate buttons on mount
    const buttons = document.querySelectorAll('.link-button');
    buttons.forEach((button, index) => {
      setTimeout(() => {
        (button as HTMLElement).style.opacity = '1';
        (button as HTMLElement).style.transform = 'translateX(0)';
      }, 600 + index * 100);
    });
  }, []);

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
      <div className="container">
        <div className="profile-section">
          <img src="https://diservice.kz/image.jpg" alt="Profile" className="profile-img" />
          <div className="profile-name">dosikedit</div>
          <div className="profile-bio">Креатор, разработчик, исследователь. Связывайтесь</div>
        </div>
        <div className="links-section">
          <a href="https://t.me/dosikedit" target="_blank" rel="noopener noreferrer" className="link-button">
            <img src="https://diservice.kz/artage-io-thumb-e93a7e18a8ece5e144c0e949eb147cf1.png" alt="Telegram" /> Telegram
          </a>
          <a href="mailto:trabajzandos@gmail.com" className="link-button">
            <img src="https://diservice.kz/gmail-png-icon-12.jpg" alt="Email" /> Email
          </a>
          <a href="https://instagram.com/dosikte" target="_blank" rel="noopener noreferrer" className="link-button">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Instagram_simple_icon.svg/120px-Instagram_simple_icon.svg.png" alt="Instagram" /> Instagram
          </a>
          <a href="https://github.com/dosik67" target="_blank" rel="noopener noreferrer" className="link-button">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/120px-GitHub_Invertocat_Logo.svg.png" alt="GitHub" /> GitHub
          </a>
          <a href="https://wa.me/+87752570646" target="_blank" rel="noopener noreferrer" className="link-button">
            <img src="https://img.icons8.com/ios7/600/whatsapp.png" alt="WhatsApp" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;

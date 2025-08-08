<template>
    <div class="about dark-theme">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-overlay"></div> <!-- Add overlay for opacity -->
        <div class="hero-content container">
          <h1>Elevate Your Journey</h1>
          <p class="subtitle">
            Where exceptional vehicles meet unparalleled service. Dream Car Rentals redefines luxury mobility.
          </p>
          <div class="stats-bar">
            <div class="stat" v-for="(stat, index) in stats" :key="index">
              <i :class="stat.iconClass" class="stat-icon"></i>
              <span class="number">{{ stat.value }}</span>
              <span class="label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Features Section -->
      <section class="features container">
        <h2 class="section-title">The Dream Experience</h2>
        <p class="section-subtitle">
          We curate every detail so you can focus on the drive
        </p>
        
        <div class="feature-grid">
          <div class="feature-card" v-for="(feature, index) in features" :key="index">
            <i :class="feature.iconClass" class="feature-icon"></i>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </section>
  
      <!-- Testimonials Section -->
      <section class="testimonials">
        <div class="container">
          <h2 class="section-title">Our Clients Say</h2>
          <div class="testimonial-carousel">
            <div class="testimonial" v-for="(testimonial, index) in testimonials" :key="index">
              <i class="fas fa-quote-left quote-icon"></i>
              <p class="testimonial-text">{{ testimonial.text }}</p>
              <div class="client-info">
                <i class="fas fa-user-circle client-avatar"></i>
                <div>
                  <p class="client-name">{{ testimonial.name }}</p>
                  <p class="client-title">{{ testimonial.title }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- CTA Section -->
      <section class="cta-parallax" :style="{ backgroundImage: 'url(@/assets/cta-bg.jpg)' }">
        <div class="cta-content">
          <h2>Your Dream Drive Awaits</h2>
          <p>
            Experience automotive perfection tailored to your desires.
          </p>
          <div class="cta-buttons">
            <button class="primary-btn" @click="$router.push('/fleet')">
              <i class="fas fa-car btn-icon"></i>
              Browse Fleet
            </button>
            <button class="outline-btn" @click="$router.push('/contact')">
              <i class="fas fa-phone-alt btn-icon"></i>
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        stats: [
          { iconClass: 'fas fa-car-side', value: '50+', label: 'Exclusive Vehicles' },
          { iconClass: 'fas fa-calendar-check', value: '24/7', label: 'Availability' },
          { iconClass: 'fas fa-smile-beam', value: '100%', label: 'Satisfaction' },
          { iconClass: 'fas fa-clock', value: '10min', label: 'Response Time' }
        ],
        features: [
          {
            iconClass: 'fas fa-car-side',
            title: 'Exclusive Fleet',
            description: 'Handpicked luxury and sports cars from the world\'s most renowned brands.'
          },
          {
            iconClass: 'fas fa-medal',
            title: 'Award-Winning',
            description: 'Recognized for excellence in luxury vehicle service and customer care.'
          },
          {
            iconClass: 'fas fa-user-shield',
            title: 'VIP Treatment',
            description: 'Dedicated concierge team providing white-glove service.'
          },
          {
            iconClass: 'fas fa-route',
            title: 'Scenic Routes',
            description: 'Curated driving experiences for special occasions.'
          }
        ],
        testimonials: [
          {
            text: 'The Ferrari 488 Spider made my birthday unforgettable. Impeccable service from start to finish!',
            name: 'Michael T.',
            title: 'Tech Entrepreneur'
          },
          {
            text: 'As a car enthusiast, I appreciate their meticulous maintenance. The Lamborghini drove like new.',
            name: 'Sarah L.',
            title: 'Automotive Journalist'
          },
          {
            text: 'Their concierge service saved our wedding day when our original transportation fell through.',
            name: 'David & Emily R.',
            title: 'Newlyweds'
          }
        ]
      }
    }
  }
  </script>
  
  
  <style scoped>
  /* Modern Dark Theme */
  .dark-theme {
    --bg-color: #121212;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --accent: #f39c12;
    --card-bg: #1e1e1e;
    --border: #333333;
  }
  
  /* Base Styles */
  .about {
    background-color: var(--bg-color);
    color: var(--text-primary);
    overflow-x: hidden;
    font-family: 'Poppins', sans-serif;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  /* Hero Section */
  .hero {
    height: 70vh;
    min-height: 500px;
    display: flex;
    align-items: center;
    background: url('/src/assets/luxury-about-bg.jpg') no-repeat center center / cover;
    position: relative;
  }
  
  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5); /* Add a dark overlay with 50% opacity */
    z-index: 1;
  }
  
  .hero-content {
    position: relative;
    z-index: 2; /* Ensure content is above the overlay */
    text-align: center;
    width: 100%;
  }
  
  .hero h1 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 300;
    letter-spacing: 1px;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
  }
  
  .subtitle {
    font-size: 1.2rem;
    max-width: 700px;
    margin: 0 auto 3rem;
    line-height: 1.6;
  }
  
  /* Stats Bar */
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .stat {
    text-align: center;
    padding: 1.5rem;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
  }
  
  .stat-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: var(--accent);
  }
  
  .number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent);
    line-height: 1;
    margin-bottom: 0.5rem;
  }
  
  .label {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.8;
  }
  
  /* Features Section */
  .section-title {
    font-size: 2rem;
    text-align: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
    position: relative;
    display: inline-block;
  }
  
  .section-title::after {
    content: '';
    display: block;
    width: 50px;
    height: 3px;
    background: var(--accent);
    margin: 1rem auto 0;
  }
  
  .section-subtitle {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 3rem;
    font-size: 1.1rem;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .feature-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    margin-bottom: 10px;
    transition: all 0.3s ease;
    border: 1px solid var(--border);
  }
  
  .feature-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  }
  
  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: var(--accent);
    transition: transform 0.3s ease;
  }
  
  .feature-card:hover .feature-icon {
    transform: scale(1.1);
  }
  
  .feature-card h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
  
  .feature-card p {
    color: var(--text-secondary);
    line-height: 1.6;
  }
  
  /* Testimonials */
  .testimonials {
    padding: 5rem 0;
    background: var(--card-bg);
  }
  
  .testimonial-carousel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .testimonial {
    background: var(--bg-color);
    padding: 2rem;
    border-radius: 12px;
    position: relative;
    border: 1px solid var(--border);
  }
  
  .quote-icon {
    font-size: 1.5rem;
    color: var(--accent);
    opacity: 0.3;
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
  }
  
  .testimonial-text {
    font-style: italic;
    margin-bottom: 1.5rem;
    padding-top: 1rem;
  }
  
  .client-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .client-avatar {
    font-size: 2.5rem;
    color: var(--accent);
  }
  
  .client-name {
    font-weight: 600;
    margin-bottom: 0.2rem;
  }
  
  .client-title {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  
  /* CTA Parallax */
  .cta-parallax {
    height: 50vh;
    min-height: 400px;
    background-attachment: fixed;
    background-position: center;
    background-size: cover;
    display: flex;
    align-items: center;
    position: relative;
  }
  
  .cta-parallax::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
  }
  
  .cta-content {
    position: relative;
    z-index: 2;
    text-align: center;
    width: 100%;
  }
  
  .cta-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .cta-content p {
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto 2rem;
  }
  
  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  
  .primary-btn, .outline-btn {
    padding: 12px 30px;
    border-radius: 30px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-icon {
    font-size: 1rem;
  }
  
  .primary-btn {
    background: var(--accent);
    color: white;
    border: none;
  }
  
  .primary-btn:hover {
    background: #e67e22;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
  }
  
  .outline-btn {
    background: transparent;
    color: white;
    border: 2px solid white;
  }
  
  .outline-btn:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-2px);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .stats-bar {
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .hero {
      height: auto;
      padding: 100px 0;
    }
  
    .testimonial-carousel {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 480px) {
    .stats-bar {
      grid-template-columns: 1fr;
    }
    
    .hero h1 {
      font-size: 2rem;
    }
    
    .subtitle {
      font-size: 1rem;
    }
  }
  </style>
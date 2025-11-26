

import { Account, Booking, Transaction, User, MonthlyMetric, Asset, Package, Client, Notification, StudioConfig } from './types';

export const STUDIO_CONFIG: StudioConfig = {
  name: 'LUMINA STUDIOS',
  address: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
  phone: '+62 812 9988 7766',
  website: 'www.luminastudios.id',
  
  // Financial Defaults
  taxRate: 11, 
  requiredDownPaymentPercentage: 50, // Default 50% DP
  paymentDueDays: 0, // Due on day of shoot
  bankName: 'BCA',
  bankAccount: '883-291-001',
  bankHolder: 'PT Lumina Kreatif Indonesia',
  
  // Operational Defaults
  operatingHoursStart: '09:00',
  operatingHoursEnd: '21:00',
  bufferMinutes: 15, 
  defaultTurnaroundDays: 7,

  logoUrl: '', 
  npwp: '82.992.112.9-442.000',
  invoiceFooter: 'Payment is non-refundable. Reschedule allowed max 1x.',
  
  rooms: [
      { id: 'r1', name: 'STUDIO A', type: 'INDOOR', color: 'indigo' },
      { id: 'r2', name: 'STUDIO B', type: 'INDOOR', color: 'purple' },
      { id: 'r3', name: 'OUTDOOR', type: 'OUTDOOR', color: 'emerald' }
  ],
  templates: {
      booking: "Hi {clientName}, confirmed booking for {package} on {date} at {time}. Location: {studio}. Thanks!",
      reminder: "Hi {clientName}, reminder for payment of {balance}. Bank: {bankName} {bankAccount}.",
      thanks: "Thanks {clientName} for shooting with us!"
  },
  // Default Site Configuration
  site: {
      subdomain: 'lumina-jakarta',
      title: 'LUMINA STUDIOS',
      headline: 'Capturing Moments, Creating Legacy.',
      description: 'A premier photography studio in Jakarta specializing in portraiture, commercial, and editorial work.',
      theme: 'BOLD',
      heroImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop',
      showPricing: true,
      showTeam: true,
      showPortfolio: true,
      showBookingWidget: true, // Enabled by default
      isPublished: false,
      instagramUrl: 'https://instagram.com/lumina',
      gallery: [
        { id: 'g1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', caption: 'Editorial' },
        { id: 'g2', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80', caption: 'Portrait' },
        { id: 'g3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', caption: 'Fashion' },
        { id: 'g4', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', caption: 'Commercial' }
      ],
      seo: {
        title: 'Lumina Studios | Best Photography Studio in Jakarta',
        description: 'Professional photography services for weddings, fashion, and corporate events.',
        keywords: ['photography', 'jakarta', 'studio', 'wedding', 'fashion']
      },
      pixels: {
          facebookPixelId: '',
          googleTagId: '',
          tiktokPixelId: '',
          googleTagManagerId: ''
      },
      announcement: {
        enabled: true,
        text: '🎉 Book now for December and get 20% off all packages!',
        link: '#pricing',
        color: '#bef264', // lumina-accent
        textColor: '#0c0a09' // lumina-base
      },
      testimonials: [
          { id: 't1', clientName: 'Putri & Dimas', text: 'The team was incredibly professional and the photos turned out better than we could have imagined.', rating: 5 },
          { id: 't2', clientName: 'Fashion Weekly', text: 'Lumina provides the best editorial lighting in the city. A pleasure to work with.', rating: 5 }
      ],
      faq: [
          { id: 'f1', question: 'Do you provide raw files?', answer: 'For our Premium packages, raw files are included. For other packages, they can be purchased as an add-on.' },
          { id: 'f2', question: 'Can we bring pets?', answer: 'Yes! Studio A is pet-friendly. Please let us know in advance.' }
      ],
      beforeAfter: {
          enabled: true,
          beforeImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80&sat=-100', // Grayscale version
          afterImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80', // Color version
          label: 'Professional Retouching'
      },
      branding: {
          faviconUrl: '',
          socialShareImage: ''
      },
      pages: [
          {
              id: 'p-wedding',
              slug: 'wedding',
              title: 'Weddings',
              headline: 'Love in every frame.',
              description: 'Timeless wedding photography that captures the essence of your special day.',
              heroImage: 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?auto=format&fit=crop&w=800&q=80',
              showPortfolio: true,
              showPricing: true,
              showBookingWidget: true,
              gallery: [
                  { id: 'wg1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', caption: 'Ceremony' },
                  { id: 'wg2', url: 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?auto=format&fit=crop&w=800&q=80', caption: 'Reception' }
              ],
              sections: [
                  {
                      id: 's1',
                      type: 'HERO',
                      content: {
                          headline: 'Timeless Weddings',
                          subheadline: 'Captured with elegance and emotion',
                          image: 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?auto=format&fit=crop&w=1200&q=80'
                      }
                  },
                  {
                      id: 's2',
                      type: 'TEXT_IMAGE',
                      content: {
                          headline: 'Our Philosophy',
                          description: 'We believe wedding photography should be more than just poses. It is about capturing the fleeting moments, the tears of joy, and the silent exchanges of love. Our approach is documentary-style with an editorial flair.',
                          image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                          layout: 'RIGHT'
                      }
                  },
                  {
                      id: 's3',
                      type: 'FEATURES',
                      content: {
                          headline: 'Why Choose Lumina?',
                          items: [
                              { title: 'Editorial Quality', text: 'Magazine-worthy lighting and composition.' },
                              { title: 'Fast Delivery', text: 'Receive your gallery within 14 days.' },
                              { title: 'Two Shooters', text: 'We always bring a second photographer for candid angles.' }
                          ]
                      }
                  },
                  {
                      id: 's4',
                      type: 'PRICING',
                      content: {
                          headline: 'Investment'
                      }
                  },
                  {
                      id: 's5',
                      type: 'CTA_BANNER',
                      content: {
                          headline: 'Ready to tell your story?',
                          buttonText: 'Check Availability'
                      }
                  }
              ]
          },
          // NEW: HORMOZI STYLE LONG COPY SALES PAGE FOR MALANG GRADUATION (AUTHORITY & TRUST VERSION)
          {
              id: 'p-grad-malang',
              slug: 'wisuda-malang',
              title: 'Graduation Portrait',
              headline: '4 TAHUN PERJUANGANMU PANTAS DIABADIKAN DENGAN SEMPURNA.',
              description: 'Sesi foto wisuda eksklusif untuk Mahasiswi UB, UM, & UMM yang mengutamakan kualitas, kenyamanan, dan hasil yang timeless.',
              heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop',
              showPortfolio: true,
              showPricing: true,
              showBookingWidget: true,
              gallery: [
                  { id: 'g1', url: 'https://images.unsplash.com/photo-1621600411688-4be93cd68504?auto=format&fit=crop&w=800&q=80', caption: 'Timeless Portrait' },
                  { id: 'g2', url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80', caption: 'Celebration' }
              ],
              sections: [
                  {
                      id: 'grad-hero',
                      type: 'HERO',
                      content: {
                          headline: 'JANGAN BIARKAN MOMEN SEKALI SEUMUR HIDUPMU TERLIHAT "BIASA SAJA".',
                          subheadline: 'Makeup sejak jam 3 pagi. Kebaya pilihan terbaik. Senyum kebanggaan orang tua. Ini bukan sekadar foto, ini adalah pembuktian.',
                          image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=1200&q=80'
                      }
                  },
                  {
                      id: 'grad-pain-trust',
                      type: 'TEXT_IMAGE',
                      content: {
                          headline: 'Kami Tahu Kekhawatiran Terbesarmu.',
                          description: 'Banyak wisudawan yang datang dengan rasa cemas: "Aku nggak photogenic", "Aku kaku kalau di depan kamera", atau "Takut makeup terlihat berminyak di foto". \n\nDi Lumina, tugas kami bukan hanya menekan tombol shutter. Tugas kami adalah **mengarahkan, menata, dan memastikan angle terbaikmu** tertangkap sempurna. \n\nKamu tidak perlu menjadi model profesional untuk mendapatkan foto yang layak dipajang di ruang tamu seumur hidup.',
                          image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
                          layout: 'LEFT'
                      }
                  },
                  {
                      id: 'grad-authority-tech',
                      type: 'FEATURES',
                      content: {
                          headline: 'MENGAPA HASIL KAMI BERBEDA?',
                          items: [
                              { title: 'Skin-Perfecting Light', text: 'Teknologi lighting khusus yang menyamarkan tekstur kulit tanpa menghilangkan detail makeup mahalmu.' },
                              { title: 'Guided Posing System', text: 'Tidak ada lagi mati gaya. Kami arahkan gesture jari-demi-jari agar terlihat luwes, jenjang & elegan.' },
                              { title: 'Color Calibration', text: 'Warna kebaya dan toga akan akurat 100% sesuai aslinya. Tidak ada filter yang merusak warna kulit.' },
                              { title: 'Editorial Retouching', text: 'Edit wajah natural. Kami menghilangkan jerawat/noda, tapi tidak mengubah bentuk wajah aslimu.' },
                              { title: 'Comfort Priority', text: 'Studio dingin dan wangi. Mood yang bagus akan menghasilkan ekspresi yang bagus.' },
                              { title: 'Live Preview', text: 'Lihat hasil foto langsung di layar besar saat pemotretan. Koreksi langsung jika ada yang kurang pas.' }
                          ]
                      }
                  },
                  {
                      id: 'grad-social-proof',
                      type: 'TESTIMONIALS',
                      content: {
                          headline: 'DIPERCAYA OLEH MAHASISWI MALANG',
                      }
                  },
                  {
                      id: 'grad-experience',
                      type: 'TEXT_IMAGE',
                      content: {
                          headline: 'The "Vogue" Experience.',
                          description: 'Lupakan studio foto yang terasa seperti pabrik—buru-buru, antri berjam-jam, dan panas. \n\nDi Lumina, kamu mendapatkan **Private Session**. Ruang ganti yang luas, AC dingin, dan playlist musik favoritmu. \n\nFotografer kami akan memandumu pose jari-demi-jari. Kami akan memperbaiki rambutmu yang berantakan. Kami akan memastikan kebayamu jatuh dengan indah. Karena detail kecil itulah yang membedakan foto biasa dengan foto kualitas majalah.',
                          image: 'https://images.unsplash.com/photo-1595959183082-7bce70789a61?auto=format&fit=crop&w=800&q=80',
                          layout: 'RIGHT'
                      }
                  },
                  {
                      id: 'grad-anti-pitch',
                      type: 'TEXT_IMAGE',
                      content: {
                          headline: 'KAMI MUNGKIN BUKAN UNTUKMU.',
                          description: 'Jika kamu mencari studio foto termurah di Malang, kami bukan orangnya. Ada banyak studio lain yang menawarkan paket Rp 50.000 dengan hasil seadanya. \n\nTapi jika kamu menghargai **Kualitas, Privasi, dan Kenyamanan**... jika kamu ingin foto yang akan kamu banggakan 10 tahun dari sekarang... maka Lumina adalah satu-satunya pilihan logis.',
                          image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
                          layout: 'CENTER'
                      }
                  },
                  {
                      id: 'grad-pricing',
                      type: 'PRICING',
                      content: {
                          headline: 'EXCLUSIVE GRADUATION PACKAGE'
                      }
                  },
                  {
                      id: 'grad-guarantee',
                      type: 'TEXT_IMAGE',
                      content: {
                          headline: 'GARANSI KEPUASAN 100%',
                          description: 'Kami sangat yakin dengan standar kami. \n\nJika setelah sesi foto kamu merasa tidak ada satupun foto yang bagus (bad angle, lighting jelek), katakan pada kami saat itu juga. \n\nKami akan melakukan **Reshoot (Foto Ulang)** GRATIS di tempat, atau kami kembalikan uang bookingmu 100%. Tanpa drama. Tanpa syarat ribet. \n\nKamu berhak mendapatkan foto wisuda yang membuatmu bangga.',
                          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
                          layout: 'LEFT'
                      }
                  },
                  {
                      id: 'grad-cta',
                      type: 'CTA_BANNER',
                      content: {
                          headline: 'SLOT WEEKEND SUDAH TERISI 80%.',
                          buttonText: 'Amankan Jadwalmu Sekarang'
                      }
                  },
                  {
                      id: 'grad-faq',
                      type: 'FAQ',
                      content: {
                          headline: 'FREQUENTLY ASKED QUESTIONS',
                          items: [
                              { title: 'Apakah bisa foto grup dengan keluarga?', text: 'Tentu. Paket kami fleksibel untuk foto solo maupun keluarga inti (maksimal 6 orang tanpa biaya tambahan).' },
                              { title: 'Kapan file foto diterima?', text: 'Softfile preview dikirim di hari yang sama. Hasil edit final maksimal 3 hari kerja.' },
                              { title: 'Saya tidak bisa makeup, apakah disediakan?', text: 'Kami bekerja sama dengan MUA terbaik di Malang. Hubungi admin untuk paket bundling Foto + Makeup.' }
                          ]
                      }
                  }
              ]
          }
      ]
  }
};

export const USERS: User[] = [
    { id: 'u1', name: 'Alex Sander', role: 'OWNER', avatar: 'https://ui-avatars.com/api/?name=Alex+Sander&background=0D8ABC&color=fff', email: 'alex@lumina.id', phone: '081234567890', status: 'ACTIVE', joinedDate: '2023-01-01', commissionRate: 0, unavailableDates: [] },
    { id: 'u2', name: 'Sarah Miller', role: 'PHOTOGRAPHER', avatar: 'https://ui-avatars.com/api/?name=Sarah+Miller&background=random', email: 'sarah@lumina.id', phone: '081234567891', status: 'ACTIVE', specialization: 'Portrait', commissionRate: 15, joinedDate: '2023-02-15', unavailableDates: [] },
    { id: 'u3', name: 'Mike Ross', role: 'EDITOR', avatar: 'https://ui-avatars.com/api/?name=Mike+Ross&background=random', email: 'mike@lumina.id', phone: '081234567892', status: 'ACTIVE', specialization: 'Color Grading', commissionRate: 10, joinedDate: '2023-03-01', unavailableDates: [] },
    { id: 'u4', name: 'Jessica Lee', role: 'ADMIN', avatar: 'https://ui-avatars.com/api/?name=Jessica+Lee&background=random', email: 'jess@lumina.id', phone: '081234567893', status: 'ACTIVE', joinedDate: '2023-01-10', unavailableDates: [] }
];

export const ACCOUNTS: Account[] = [
    { id: 'acc1', name: 'Main Business Account', type: 'BANK', balance: 150000000, accountNumber: '883-291-001' },
    { id: 'acc2', name: 'Petty Cash', type: 'CASH', balance: 2500000 },
    { id: 'acc3', name: 'Operational Savings', type: 'BANK', balance: 50000000, accountNumber: '883-291-002' }
];

export const PACKAGES: Package[] = [
    { 
        id: 'p1', 
        name: 'Essentials', 
        price: 1500000, 
        duration: 1, 
        features: ['1 Hour Session', '10 Edited Photos', '1 Studio Background'], 
        active: true, 
        turnaroundDays: 5,
        costBreakdown: [
            { id: 'cost1', description: 'Studio Cleaning', amount: 25000, category: 'OTHER' },
            { id: 'cost2', description: 'Electricity & Utilities', amount: 50000, category: 'OTHER' }
        ]
    },
    { 
        id: 'p2', 
        name: 'Standard', 
        price: 2500000, 
        duration: 2, 
        features: ['2 Hour Session', '25 Edited Photos', '2 Studio Backgrounds', '1 Canvas Print'], 
        active: true, 
        turnaroundDays: 7,
        costBreakdown: [
            { id: 'cost3', description: 'Canvas Print 40x60', amount: 180000, category: 'MATERIAL' },
            { id: 'cost4', description: 'Freelance Assistant', amount: 150000, category: 'LABOR' },
            { id: 'cost5', description: 'Snacks & Drinks', amount: 50000, category: 'OTHER' }
        ]
    },
    { 
        id: 'p3', 
        name: 'Premium', 
        price: 5000000, 
        duration: 4, 
        features: ['4 Hour Session', 'All Raw Files', 'Unlimited Backgrounds', 'MUA Included', 'Lunch'], 
        active: true, 
        turnaroundDays: 14,
        costBreakdown: [
            { id: 'cost6', description: 'MUA Fee', amount: 750000, category: 'LABOR' },
            { id: 'cost7', description: 'Lunch Catering', amount: 150000, category: 'OTHER' },
            { id: 'cost8', description: 'Hard Drive (Deliverable)', amount: 200000, category: 'MATERIAL' },
            { id: 'cost9', description: 'Freelance Assistant', amount: 250000, category: 'LABOR' }
        ]
    }
];

export const ASSETS: Asset[] = [
    { id: 'a1', name: 'Sony A7IV', category: 'CAMERA', status: 'AVAILABLE', serialNumber: 'SN-9988221' },
    { id: 'a2', name: 'Canon R5', category: 'CAMERA', status: 'IN_USE', assignedToUserId: 'u2', serialNumber: 'SN-1122334', returnDate: '2023-11-30' },
    { id: 'a3', name: 'Godox AD600', category: 'LIGHTING', status: 'AVAILABLE', serialNumber: 'GDX-600-01' },
    { id: 'a4', name: 'Sigma 85mm f1.4', category: 'LENS', status: 'MAINTENANCE', notes: 'Focus ring stuck', serialNumber: 'SIG-85-99' }
];

export const CLIENTS: Client[] = [
    { id: 'c1', name: 'Budi Santoso', phone: '081122334455', email: 'budi@gmail.com', avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso', category: 'REGULAR', notes: 'Likes bright lighting.', joinedDate: '2023-05-10' },
    { id: 'c2', name: 'Siti Aminah', phone: '081299887766', email: 'siti@yahoo.com', avatar: 'https://ui-avatars.com/api/?name=Siti+Aminah', category: 'VIP', notes: 'High spender, always books Premium.', joinedDate: '2023-06-15' },
    { id: 'c3', name: 'John Doe', phone: '085544332211', email: 'john@doe.com', avatar: 'https://ui-avatars.com/api/?name=John+Doe', category: 'PROBLEMATIC', notes: 'Often late for payment.', joinedDate: '2023-08-20' }
];

export const BOOKINGS: Booking[] = [
    { 
        id: 'b1', 
        clientName: 'Siti Aminah', 
        clientPhone: '081299887766', 
        clientId: 'c2',
        date: new Date().toISOString().split('T')[0], 
        timeStart: '10:00', 
        duration: 2, 
        package: 'Standard', 
        price: 2500000, 
        paidAmount: 2500000, 
        status: 'SHOOTING', 
        photographerId: 'u2', 
        studio: 'STUDIO A',
        contractStatus: 'SIGNED',
        items: [
            { id: 'i1', description: 'Standard Package', quantity: 1, unitPrice: 2500000, total: 2500000 }
        ],
        comments: [],
        discount: { type: 'FIXED', value: 0 },
        timeLogs: []
    },
    { 
        id: 'b2', 
        clientName: 'Budi Santoso', 
        clientPhone: '081122334455', 
        clientId: 'c1',
        date: new Date().toISOString().split('T')[0], 
        timeStart: '14:00', 
        duration: 1, 
        package: 'Essentials', 
        price: 1500000, 
        paidAmount: 500000, 
        status: 'BOOKED', 
        photographerId: 'u2', 
        studio: 'STUDIO B',
        contractStatus: 'PENDING',
        comments: [],
        discount: { type: 'FIXED', value: 0 },
        timeLogs: []
    }
];

export const TRANSACTIONS: Transaction[] = [
    { id: 't1', date: '2023-11-20T10:00:00Z', description: 'DP Booking - Siti Aminah', amount: 2500000, type: 'INCOME', accountId: 'acc1', category: 'Sales / Booking', status: 'COMPLETED', bookingId: 'b1' },
    { id: 't2', date: '2023-11-21T14:00:00Z', description: 'Monthly Electricity', amount: 1500000, type: 'EXPENSE', accountId: 'acc1', category: 'Utilities', status: 'COMPLETED' },
    { id: 't3', date: '2023-11-22T09:00:00Z', description: 'DP Booking - Budi Santoso', amount: 500000, type: 'INCOME', accountId: 'acc1', category: 'Sales / Booking', status: 'COMPLETED', bookingId: 'b2' }
];

export const NOTIFICATIONS: Notification[] = [
    { id: 'n1', title: 'System Update', message: 'Lumina v2.4.0 is live.', time: '2h ago', read: false, type: 'INFO' },
    { id: 'n2', title: 'New Booking', message: 'Budi Santoso booked Essentials.', time: '5h ago', read: false, type: 'SUCCESS' }
];
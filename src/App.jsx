import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Check, ChevronDown, ChevronRight,
  CircleHelp, Compass, CreditCard, Heart, LockKeyhole, MapPin, Menu, Minus, PackageCheck, Plus,
  Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Star, Trash2, Truck, UserRound, X,
} from 'lucide-react';
import { categories, products } from './products.js';

const readStore = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};
const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

function App() {
  const [page, setPage] = useState('home');
  const [category, setCategory] = useState('All gear');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Featured');
  const [maxPrice, setMaxPrice] = useState(20000);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState(() => readStore('roamride-cart-inr-v2', []));
  const [wishlist, setWishlist] = useState(() => readStore('roamride-wishlist', []));
  const [orders, setOrders] = useState(() => readStore('roamride-orders-inr-v2', []));
  const [user, setUser] = useState(() => readStore('roamride-user', null));
  const [reviews, setReviews] = useState(() => readStore('roamride-reviews-v2', {}));
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', postal: '', country: 'India', card: '', expiry: '', cvc: '' });
  const [trackingOrder, setTrackingOrder] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => localStorage.setItem('roamride-cart-inr-v2', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('roamride-wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('roamride-orders-inr-v2', JSON.stringify(orders)), [orders]);
  useEffect(() => {
    localStorage.removeItem('roamride-reviews-v1');
    localStorage.setItem('roamride-reviews-v2', JSON.stringify(reviews));
  }, [reviews]);
  useEffect(() => {
    if (user) localStorage.setItem('roamride-user', JSON.stringify(user));
    else localStorage.removeItem('roamride-user');
  }, [user]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal >= 10000 || subtotal === 0 ? 0 : 499;
  const total = subtotal - discount + shipping;
  const query = search.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory = category === 'All gear' || product.category === category;
      const matchesSearch = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch && product.price <= maxPrice;
    });
    if (sort === 'Price: low to high') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'Price: high to low') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'Top rated') result = [...result].sort((a, b) => {
      const average = (id) => {
        const entries = reviews[id] || [];
        return entries.length ? entries.reduce((sum, review) => sum + review.rating, 0) / entries.length : 0;
      };
      return average(b.id) - average(a.id);
    });
    return result;
  }, [category, query, sort, maxPrice, reviews]);
  const suggestions = query ? products.filter((product) => product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query)).slice(0, 4) : [];

  function goTo(nextPage) {
    setPage(nextPage);
    setMenuOpen(false);
    setMobileSearch(false);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function addToCart(product, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...current, { ...product, quantity }];
    });
    setToast(`${product.name} added to your bag`);
  }
  function changeQuantity(id, delta) {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0));
  }
  function toggleWishlist(product) {
    const exists = wishlist.includes(product.id);
    setWishlist((current) => exists ? current.filter((id) => id !== product.id) : [...current, product.id]);
    setToast(exists ? 'Removed from your wishlist' : 'Saved for later');
  }
  function showCatalog(nextCategory = 'All gear') {
    setCategory(nextCategory);
    setSearch('');
    goTo('shop');
  }
  function placeOrder(event) {
    event.preventDefault();
    const order = {
      id: `RR-${Date.now().toString().slice(-7)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: cart,
      total,
      status: 'On its way',
      address: `${form.address}, ${form.city} ${form.postal}`,
      email: form.email || user?.email || '',
      timeline: 'Arriving in 3–5 business days',
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    setCouponApplied(false);
    setCoupon('');
    setTrackingOrder(order);
    setCheckoutStep(1);
    goTo('confirmation');
  }
  function applyCoupon() {
    if (coupon.trim().toUpperCase() === 'ROAM10') {
      setCouponApplied(true);
      setToast('Nice! 10% off your order.');
    } else {
      setCouponApplied(false);
      setToast('That code didn’t work. Try ROAM10.');
    }
  }
  function signIn(event) {
    event.preventDefault();
    const nextUser = { name: form.name.trim() || form.email.split('@')[0], email: form.email };
    setUser(nextUser);
    setModal('');
    setToast(`Welcome${nextUser.name ? `, ${nextUser.name}` : ' back'}!`);
  }
  function openCheckout() {
    if (!user) {
      setModal('auth');
      setToast('Sign in or create an account to continue');
      return;
    }
    setForm((current) => ({ ...current, name: current.name || user.name, email: current.email || user.email }));
    setCheckoutStep(1);
    goTo('checkout');
  }
  function addReview(productId, review) {
    setReviews((current) => ({
      ...current,
      [productId]: [...(current[productId] || []), { ...review, date: new Date().toISOString() }],
    }));
  }

  function ProductCard({ product, index = 0 }) {
    const productReviews = reviews[product.id] || [];
    const averageRating = productReviews.length
      ? (productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(1)
      : null;
    return (
      <article className="product-card reveal-on-scroll" style={{ '--card-index': index % 8 }}>
        <div className="product-image-wrap">
          <button className="product-image-button" onClick={() => setSelectedProduct(product)} aria-label={`View ${product.name}`}>
            <img src={product.image} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.src = `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=82`; }} />
          </button>
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <button className={`heart-button ${wishlist.includes(product.id) ? 'is-saved' : ''}`} onClick={() => toggleWishlist(product)} aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}>
            <Heart size={17} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
          </button>
          <button className="quick-add" onClick={() => addToCart(product)}><Plus size={15} /> Quick add</button>
        </div>
        <div className="product-info">
          <div className="product-category">{product.category} <span>{averageRating ? <><Star size={12} fill="currentColor" /> {averageRating} <span className="review-count">({productReviews.length})</span></> : <span className="review-count">New · be first to review</span>}</span></div>
          <button className="product-name" onClick={() => setSelectedProduct(product)}>{product.name}</button>
          <strong>{money(product.price)}</strong>
        </div>
      </article>
    );
  }

  function Header() {
    return <>
      <div className="announcement">A little more adventure, a little less shipping. <b>Free shipping over ₹10,000</b><ArrowRight size={13} /></div>
      <header className="site-header">
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu /></button>
        <button className="brand" onClick={() => goTo('home')} aria-label="ROAMRIDE home"><span className="brand-mark"><Compass size={23} strokeWidth={2.2} /></span>ROAMRIDE<span className="brand-period">.</span></button>
        <nav className={`main-nav ${menuOpen ? 'nav-open' : ''}`}>
          <button onClick={() => showCatalog()}>Shop all</button>
          {categories.slice(1).map((item) => <button key={item} onClick={() => showCatalog(item)}>{item}</button>)}
          <button onClick={() => goTo('about')}>Our story</button>
        </nav>
        <div className={`header-actions ${mobileSearch ? 'search-open' : ''}`}>
          {mobileSearch
            ? <div className="mobile-search-field"><Search size={18} /><input autoFocus value={search} onChange={(e) => { setSearch(e.target.value); if (page !== 'shop') setPage('shop'); }} placeholder="What are you looking for?" onKeyDown={(e) => e.key === 'Enter' && goTo('shop')} /><button onClick={() => { setMobileSearch(false); setSearch(''); }}><X size={18} /></button></div>
            : <button className="icon-button" aria-label="Search" onClick={() => { setMobileSearch(true); setTimeout(() => searchRef.current?.focus(), 0); }}><Search size={20} /></button>}
          <button className="icon-button account-action" aria-label="Account" onClick={() => user ? goTo('account') : setModal('auth')}><UserRound size={20} /></button>
          <button className="icon-button wishlist-action" aria-label="Wishlist" onClick={() => goTo('wishlist')}><Heart size={20} />{wishlist.length > 0 && <i>{wishlist.length}</i>}</button>
          <button className="icon-button bag-action" aria-label="Shopping bag" onClick={() => setModal('cart')}><ShoppingBag size={20} />{cartCount > 0 && <i>{cartCount}</i>}</button>
        </div>
      </header>
    </>;
  }

  function SearchBox() {
    return <div className="search-box-wrap">
      <div className="search-box"><Search size={19} /><input ref={searchRef} value={search} onChange={(e) => { setSearch(e.target.value); if (page !== 'shop') setPage('shop'); }} onFocus={() => { if (page !== 'shop') setPage('shop'); }} placeholder="Search travel and bike gear..." /><kbd>⌘ K</kbd></div>
      {suggestions.length > 0 && <div className="search-suggestions">{suggestions.map((product) => <button key={product.id} onClick={() => { setSearch(''); setSelectedProduct(product); }}><img src={product.image} alt="" /><span>{product.name}<small>{product.category}</small></span><strong>{money(product.price)}</strong><ArrowUpRight size={15} /></button>)}<button className="all-results" onClick={() => goTo('shop')}>See all results for “{search}” <ArrowRight size={15} /></button></div>}
    </div>;
  }

  function HomePage() {
    return <main>
      <section className="hero reveal-on-scroll">
        <div className="hero-copy"><div className="eyebrow"><span></span> MADE FOR THE IN-BETWEEN</div><h1>Find your<br /><em>elsewhere.</em></h1><p>Thoughtful travel and cycling gear for the places you haven’t been yet — and the routes you can’t stop thinking about.</p><div className="hero-buttons"><button className="button button-dark" onClick={() => showCatalog()}>Explore the collection <ArrowRight size={17} /></button><button className="story-link" onClick={() => goTo('about')}>Our way of getting there <ArrowUpRight size={15} /></button></div><div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>K</span></div><div><div className="proof-stars">★★★★★</div><small>Loved by 12,000+ happy roamers</small></div></div></div>
        <div className="hero-image"><img src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1500&q=88" alt="Hiker taking in a mountain view" /><div className="hero-image-label"><span>01 / 04</span><span>Somewhere in the Dolomites <ArrowUpRight size={13} /></span></div><div className="hero-stamp">GO<br />A LITTLE<br />FURTHER <ArrowUpRight size={19} /></div></div>
      </section>
      <section className="intro-band reveal-on-scroll"><span>LESS STUFF. <b>MORE STORIES.</b></span><span>BUILT TO GO THE DISTANCE <ArrowRight size={15} /></span><span>DESIGNED FOR THE LONG WAY <b>↗</b></span></section>
      <section className="home-collection section-wrap reveal-on-scroll"><div className="section-heading"><div><div className="eyebrow">THE GOOD STUFF</div><h2>Made for the way <em>out.</em></h2></div><button className="text-link" onClick={() => showCatalog()}>Shop all gear <ArrowRight size={16} /></button></div>
        <div className="category-tiles">{[
          { name: 'Travel Bags', desc: 'Carry what matters.', img: products[0].image, count: '08 ITEMS' },
          { name: 'Travel Accessories', desc: 'The little things, sorted.', img: products[8].image, count: '12 ITEMS' },
          { name: 'Bike Accessories', desc: 'For the ride and the long way.', img: products[20].image, count: '12 ITEMS' },
          { name: 'Camp Accessories', desc: 'Make outside feel like yours.', img: products[32].image, count: '08 ITEMS' },
        ].map((tile, i) => <button className={`category-tile tile-${i}`} key={tile.name} onClick={() => showCatalog(tile.name)}><img src={tile.img} alt="" /><span className="tile-shade"></span><span className="tile-count">{tile.count}</span><span className="tile-copy"><small>{tile.desc}</small><strong>{tile.name} <ArrowUpRight size={20} /></strong></span></button>)}</div>
      </section>
      <section className="featured-section reveal-on-scroll"><div className="section-wrap"><div className="section-heading"><div><div className="eyebrow">THE CROWD FAVORITES</div><h2>Good gear. <em>Great stories.</em></h2></div><button className="text-link" onClick={() => showCatalog()}>Shop best sellers <ArrowRight size={16} /></button></div><div className="product-grid">{[products[0], products[10], products[20], products[22]].map((product, i) => <ProductCard product={product} index={i} key={product.id} />)}</div></div></section>
      <section className="story-banner reveal-on-scroll"><div className="story-image"><img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85" alt="A quiet alpine lake surrounded by mountains" /><span>LEAVE IT BETTER THAN YOU FOUND IT</span></div><div className="story-copy"><div className="eyebrow">A LITTLE LESS FOOTPRINT</div><h2>Go far.<br /><em>Leave light.</em></h2><p>We make fewer, better things — with recycled materials, thoughtful details, and a promise to be part of the outdoors, not apart from it.</p><button className="button button-outline" onClick={() => goTo('about')}>What we believe <ArrowUpRight size={16} /></button><div className="story-stat"><b>1% <span>FOR THE PLANET</span></b><small>A little back to the places that give us so much.</small></div></div></section>
      <section className="newsletter reveal-on-scroll"><div className="newsletter-icon"><Sparkles size={21} /></div><div><div className="eyebrow">NOTES FROM OUT THERE</div><h3>Good things, occasionally.</h3><p>Field notes, new gear, and places worth the trip. No noise.</p></div><form onSubmit={(e) => { e.preventDefault(); setToast('You’re on the list. See you out there!'); e.currentTarget.reset(); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button type="submit">Count me in <ArrowRight size={15} /></button></form></section>
    </main>;
  }

  function ShopPage() {
    return <main className="shop-page">
      <div className="shop-top"><div className="breadcrumbs"><button onClick={() => goTo('home')}>Home</button><ChevronRight size={13} /> Shop</div><div className="shop-title"><div><div className="eyebrow">A GOOD PLACE TO START</div><h1>{category === 'All gear' ? 'Travel & bike gear' : category}<span>.</span></h1><p>Travel and cycling essentials, thoughtfully made. <span>{products.length} useful things for the way out.</span></p></div><div className="shop-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search travel and bike gear" /><button onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={17} /> Filter</button></div></div>
        {suggestions.length > 0 && <div className="catalog-suggestions">{suggestions.map((product) => <button key={product.id} onClick={() => setSelectedProduct(product)}><img src={product.image} alt="" />{product.name} <ArrowUpRight size={13} /></button>)}</div>}
      </div>
      <div className="shop-body">
        <aside className={`filters ${filterOpen ? 'filters-open' : ''}`}><div className="filter-header"><h3>Filter by</h3><button onClick={() => { setCategory('All gear'); setMaxPrice(20000); }}>Clear all</button><button className="filter-close" onClick={() => setFilterOpen(false)}><X size={17} /></button></div><div className="filter-group"><p>Category</p>{categories.slice(1).map((item) => <button className={`filter-category ${category === item ? 'selected' : ''}`} key={item} onClick={() => setCategory(category === item ? 'All gear' : item)}>{item}<span>{products.filter((product) => product.category === item).length}</span></button>)}</div><div className="filter-group price-filter"><p>Price range <b>Up to {money(maxPrice)}</b></p><input type="range" min="500" max="20000" step="500" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} /><div><span>₹500</span><span>₹20,000</span></div></div><div className="filter-note"><ShieldCheck size={18} /><span>Free shipping over ₹10,000.<br />Easy 30-day returns.</span></div></aside>
        <div className="product-list"><div className="catalog-toolbar"><span>{filteredProducts.length} things to get out there with</span><label><ArrowDownUp size={15} /><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">{['Featured', 'Price: low to high', 'Price: high to low', 'Top rated'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label></div>
          {filteredProducts.length ? <div className="product-grid catalog-grid">{filteredProducts.map((product, i) => <ProductCard product={product} index={i} key={product.id} />)}</div> : <div className="empty-state"><Search size={32} /><h3>No gear found out there.</h3><p>Try a different search or clear your filters.</p><button className="button button-dark" onClick={() => { setSearch(''); setCategory('All gear'); setMaxPrice(20000); }}>Clear filters</button></div>}
        </div>
      </div>
    </main>;
  }

  function WishlistPage() {
    const saved = products.filter((product) => wishlist.includes(product.id));
    return <main className="simple-page"><div className="breadcrumbs"><button onClick={() => goTo('home')}>Home</button><ChevronRight size={13} /> Your wishlist</div><div className="page-heading"><div className="eyebrow">THE SHORTLIST</div><h1>Saved for <em>later.</em></h1><p>{saved.length} things you have your eye on.</p></div>{saved.length ? <div className="product-grid">{saved.map((product, i) => <ProductCard product={product} index={i} key={product.id} />)}</div> : <div className="empty-state"><Heart size={30} /><h3>A little room for future plans.</h3><p>Save the things you love and find them here.</p><button className="button button-dark" onClick={() => showCatalog()}>Explore the collection <ArrowRight size={16} /></button></div>}</main>;
  }

  function AccountPage() {
    return <main className="simple-page account-page"><div className="breadcrumbs"><button onClick={() => goTo('home')}>Home</button><ChevronRight size={13} /> Your account</div><div className="account-welcome"><div><div className="eyebrow">GOOD TO HAVE YOU HERE</div><h1>Hey, {user?.name || 'roamer'}<span>.</span></h1><p>{user?.email}</p></div><button className="text-link" onClick={() => { setUser(null); setToast('You’ve been signed out.'); goTo('home'); }}>Sign out <ArrowRight size={15} /></button></div><div className="account-card"><div className="account-card-heading"><div><h3>Your orders</h3><p>All the good things headed your way.</p></div><PackageCheck /></div>{orders.length ? orders.map((order) => <div className="order-row" key={order.id}><img src={order.items[0]?.image} alt="" /><div><b>Order {order.id}</b><small>Placed {order.date} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}</small></div><span className="status-pill"><span></span>{order.status}</span><strong>{money(order.total)}</strong><button className="text-link" onClick={() => { setTrackingOrder(order); goTo('confirmation'); }}>Track <ArrowRight size={14} /></button></div>) : <div className="no-orders"><p>No orders just yet. That's okay — the good stuff isn't going anywhere.</p><button className="text-link" onClick={() => showCatalog()}>Find something good <ArrowRight size={14} /></button></div>}</div><div className="account-bottom"><div><MapPin size={18} /><span><b>Shipping address</b><small>{orders[0]?.address || 'Add your first address at checkout.'}</small></span></div><div><CreditCard size={18} /><span><b>Payment details</b><small>Payments are securely simulated in this demo.</small></span></div></div><button className="admin-entry" onClick={() => goTo('admin')}>Open store admin <ArrowUpRight size={14} /></button></main>;
  }

  function CheckoutPage() {
    const field = (key, label, type = 'text', half = false) => <label className={`form-field ${half ? 'half' : ''}`}><span>{label}</span><input required type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={label} /></label>;
    return <main className="checkout-page"><div className="breadcrumbs"><button onClick={() => goTo('home')}>Home</button><ChevronRight size={13} /><button onClick={() => setModal('cart')}>Your bag</button><ChevronRight size={13} /> Checkout</div><div className="checkout-heading"><div className="eyebrow">THE GOOD STUFF IS ALMOST YOURS</div><h1>Make it <em>official.</em></h1></div>
      {!cart.length ? <div className="empty-state"><ShoppingBag size={30} /><h3>Your bag's on a little break.</h3><button className="button button-dark" onClick={() => showCatalog()}>Find your next favorite <ArrowRight size={15} /></button></div> : <div className="checkout-layout"><div className="checkout-main"><div className="checkout-steps">{['Delivery', 'Payment'].map((step, i) => <button className={checkoutStep === i + 1 ? 'step-active' : checkoutStep > i + 1 ? 'step-done' : ''} key={step} onClick={() => checkoutStep > i + 1 && setCheckoutStep(i + 1)}><span>{checkoutStep > i + 1 ? <Check size={14} /> : `0${i + 1}`}</span>{step}</button>)}</div><form onSubmit={(e) => { e.preventDefault(); if (checkoutStep === 1) setCheckoutStep(2); else placeOrder(e); }}>
        <section className="checkout-section"><div className="checkout-section-title"><div><h3>{checkoutStep === 1 ? 'Where should we send it?' : 'How would you like to pay?'}</h3><p>{checkoutStep === 1 ? 'We promise to pack it with care.' : 'Choose a card, UPI, or another simulated demo payment.'}</p></div><LockKeyhole size={18} /></div>
          {checkoutStep === 1 ? <div className="form-grid">{field('name', 'Full name')}{field('email', 'Email address', 'email')}{field('address', 'Street address')}{field('city', 'City', 'text', true)}{field('postal', 'PIN code', 'text', true)}<label className="form-field"><span>Country</span><select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>{['India', 'Nepal', 'Sri Lanka', 'Bangladesh', 'Bhutan', 'Singapore', 'United Arab Emirates'].map((countryName) => <option key={countryName}>{countryName}</option>)}</select></label></div> : <><div className="payment-note"><CreditCard size={19} /><span>Credit or debit card <small>Visa · Mastercard · Amex</small></span><span className="card-logos">VISA &nbsp;●●●</span></div><div className="form-grid">{field('card', 'Card number')}{field('expiry', 'Expiry date (MM/YY)', 'text', true)}{field('cvc', 'Security code', 'text', true)}</div></>}
        </section><div className="checkout-actions">{checkoutStep === 2 && <button type="button" className="text-link" onClick={() => setCheckoutStep(1)}><ArrowLeft size={15} /> Back to delivery</button>}<button className="button button-dark" type="submit">{checkoutStep === 1 ? 'Continue to payment' : `Place order · ${money(total)}`} <ArrowRight size={16} /></button></div><div className="secure-note"><ShieldCheck size={15} /> Safe, secure checkout. Your info stays yours.</div></form></div><OrderSummary cart={cart} subtotal={subtotal} shipping={shipping} discount={discount} total={total} /></div>}
    </main>;
  }

  function OrderSummary({ cart: items, subtotal: sub, shipping: ship, discount: disc, total: sum }) {
    return <aside className="order-summary"><h3>Your bag <span>({items.reduce((n, item) => n + item.quantity, 0)})</span></h3><div className="summary-items">{items.map((item) => <div className="summary-item" key={item.id}><div className="summary-image"><img src={item.image} alt={item.name} /><span>{item.quantity}</span></div><div><b>{item.name}</b><small>{item.color}</small></div><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="coupon-field"><input placeholder="Discount code" value={coupon} onChange={(e) => setCoupon(e.target.value)} disabled={couponApplied} /><button onClick={applyCoupon} disabled={couponApplied}>{couponApplied ? 'Applied' : 'Apply'}</button></div><div className="totals"><div><span>Subtotal</span><b>{money(sub)}</b></div><div><span>Shipping</span><b>{ship === 0 ? 'Free' : money(ship)}</b></div>{disc > 0 && <div className="discount-row"><span>ROAM10 discount</span><b>−{money(disc)}</b></div>}<div className="total-row"><span>Total</span><b>{money(sum)} <small>INR</small></b></div></div><div className="shipping-progress"><Truck size={17} /><span>{sub >= 10000 ? 'You unlocked free shipping!' : `You’re ${money(10000 - sub)} away from free shipping.`}</span></div></aside>;
  }

  function ConfirmationPage() {
    const order = trackingOrder || orders[0];
    if (!order) return <div className="empty-state"><h3>No order found.</h3><button className="button button-dark" onClick={() => showCatalog()}>Shop the collection</button></div>;
    return <main className="confirmation-page"><div className="confirmation-check"><Check size={31} /></div><div className="eyebrow">ORDER CONFIRMED · {order.id}</div><h1>Well, this is <em>exciting.</em></h1><p className="confirmation-lead">Your next adventure just got a little closer.</p><div className="tracking-card"><div className="tracking-header"><div><small>YOUR ORDER</small><h3>{order.id}</h3></div><span className="status-pill"><span></span>{order.status}</span></div><div className="tracking-progress"><div className="track-step done"><i><Check size={13} /></i><span>Order placed</span><small>{order.date}</small></div><div className="track-line active"></div><div className="track-step done"><i><PackageCheck size={14} /></i><span>Getting ready</span><small>We're on it</small></div><div className="track-line"></div><div className="track-step"><i><Truck size={14} /></i><span>On its way</span><small>Arriving in 3–5 days</small></div><div className="track-line"></div><div className="track-step"><i><MapPin size={14} /></i><span>At your door</span><small>Almost there</small></div></div><div className="tracking-address"><MapPin size={17} /><span><b>Going to</b><small>{order.address || 'Shipping details saved with your order'}</small></span><span><b>Order total</b><small>{money(order.total)}</small></span></div>{order.items?.map((item) => <div className="confirmation-item" key={item.id}><img src={item.image} alt="" /><span>{item.name} <small> × {item.quantity}</small></span><b>{money(item.price * item.quantity)}</b></div>)}</div><p className="email-note">A confirmation is on its way to <b>{order.email || 'your inbox'}</b>.</p><button className="button button-dark" onClick={() => user ? goTo('account') : showCatalog()}>Continue exploring <ArrowRight size={16} /></button></main>;
  }

  function AdminPage() {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const categoryCounts = categories.slice(1).map((item) => ({ name: item, count: products.filter((product) => product.category === item).length }));
    return <main className="admin-page"><div className="breadcrumbs"><button onClick={() => goTo('home')}>Home</button><ChevronRight size={13} /> Store admin <span className="demo-label">DEMO VIEW</span></div><div className="admin-heading"><div><div className="eyebrow">ROAMRIDE / COMMERCE</div><h1>A good day to <em>sell.</em></h1><p>Here’s what’s happening in your little corner of the outdoors.</p></div><span className="admin-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span></div><div className="admin-stats"><div><span>Gross sales</span><b>{money(revenue)}</b><small><span>↗</span> All-time demo revenue</small></div><div><span>Orders</span><b>{orders.length}</b><small><span>↗</span> {orders.length ? 'You have sales!' : 'Ready for your first sale'}</small></div><div><span>Products</span><b>{products.length}</b><small><span>↗</span> Across {categories.length - 1} categories</small></div><div><span>Avg. order value</span><b>{orders.length ? money(revenue / orders.length) : money(0)}</b><small>Across all orders</small></div></div><div className="admin-panels"><section className="admin-panel"><div className="panel-heading"><div><h3>Recent orders</h3><p>The latest good things, getting ready to go.</p></div><PackageCheck size={19} /></div>{orders.length ? <div className="admin-orders"><div className="admin-table-head"><span>ORDER</span><span>DATE</span><span>STATUS</span><span>TOTAL</span></div>{orders.map((order) => <div className="admin-order-line" key={order.id}><b>{order.id}</b><span>{order.date}</span><span className="status-pill"><span></span>{order.status}</span><b>{money(order.total)}</b></div>)}</div> : <div className="admin-empty">No orders yet — the first one is always a good one.</div>}</section><section className="admin-panel inventory-panel"><div className="panel-heading"><div><h3>Inventory overview</h3><p>Thoughtfully stocked. Ready to roam.</p></div><SlidersHorizontal size={19} /></div>{categoryCounts.map((item, i) => <div className="inventory-row" key={item.name}><span><i className={`inventory-dot dot-${i}`} />{item.name}</span><b>{item.count} products</b><div className="inventory-bar"><i style={{ width: `${item.count / 40 * 100}%` }} /></div></div>)}</section></div><div className="admin-note"><CircleHelp size={16} /> This is a local demo dashboard. Orders and revenue reflect this browser only.</div><button className="text-link" onClick={() => showCatalog()}>Back to the storefront <ArrowRight size={15} /></button></main>;
  }

  function AboutPage() {
    return <main className="about-page"><div className="about-hero"><img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=88" alt="Mountain range at golden hour" /><div className="about-hero-copy"><div className="eyebrow">OUR REASON FOR ROAMING</div><h1>More outside.<br /><em>More alive.</em></h1></div></div><section className="about-copy"><div className="eyebrow">A NOTE FROM THE ROAD</div><h2>We think the good stuff<br />happens <em>out there.</em></h2><p>That first breath of cold air at the trailhead. The detour that becomes the whole point. A little less scrolling, a lot more looking up. ROAMRIDE exists to make getting out there feel a little easier.</p><p>We make the things you take with you: considered, dependable essentials that do their job quietly, so you can get on with the important part. We use recycled materials wherever we can, make fewer things better, and put 1% of every sale back into the places we all love to roam.</p><button className="button button-dark" onClick={() => showCatalog()}>Find your elsewhere <ArrowRight size={16} /></button></section><div className="about-values"><div><BadgeCheck /><b>Made to last</b><small>Thoughtful design, practical details, long miles.</small></div><div><Compass /><b>Made to go</b><small>Built for real life, from the daily to the faraway.</small></div><div><Heart /><b>Made with care</b><small>Less impact. More intention. Always.</small></div></div></main>;
  }

  function CartDrawer() {
    return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal('')}><aside className="cart-drawer"><div className="drawer-head"><div><h2>Your bag <span>({cartCount})</span></h2><p>The good stuff you picked out.</p></div><button className="icon-button" onClick={() => setModal('')}><X /></button></div>{cart.length ? <><div className="drawer-items">{cart.map((item) => <div className="cart-line" key={item.id}><img src={item.image} alt={item.name} /><div className="cart-line-info"><button onClick={() => { setModal(''); setSelectedProduct(item); }}>{item.name}</button><small>{item.color}</small><div className="quantity-control"><button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><div className="cart-line-end"><b>{money(item.price * item.quantity)}</b><button onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))} aria-label="Remove item"><Trash2 size={15} /></button></div></div>)}</div><div className="drawer-bottom"><div className="coupon-field"><input placeholder="Discount code" value={coupon} onChange={(e) => setCoupon(e.target.value)} disabled={couponApplied} /><button onClick={applyCoupon} disabled={couponApplied}>{couponApplied ? 'Applied' : 'Apply'}</button></div><div className="totals"><div><span>Subtotal</span><b>{money(subtotal)}</b></div>{discount > 0 && <div className="discount-row"><span>ROAM10 discount</span><b>−{money(discount)}</b></div>}<div><span>Shipping</span><b>{shipping === 0 ? 'Free' : money(shipping)}</b></div><div className="total-row"><span>Total</span><b>{money(total)} <small>INR</small></b></div></div><button className="button button-dark drawer-checkout" onClick={() => { setModal(''); openCheckout(); }}>Head to checkout <ArrowRight size={16} /></button><p><ShieldCheck size={14} /> Free shipping on orders over ₹10,000 · Easy 30-day returns</p></div></> : <div className="drawer-empty"><ShoppingBag size={35} /><h3>Your bag is taking a breather.</h3><p>There’s plenty of room for something good.</p><button className="button button-dark" onClick={() => { setModal(''); showCatalog(); }}>Explore the collection <ArrowRight size={15} /></button></div>}</aside></div>;
  }

  function AuthModal() {
    return <div className="overlay modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal('')}><div className="auth-modal"><button className="modal-close" onClick={() => setModal('')}><X size={19} /></button><span className="modal-compass"><Compass size={27} /></span><div className="eyebrow">YOUR NEXT ADVENTURE</div><h2>Good to have<br /><em>you back.</em></h2><p>Sign in or make yourself at home.</p><form onSubmit={signIn}>{!user && <label className="form-field"><span>Your name <small>(optional)</small></span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></label>}<label className="form-field"><span>Email address</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label><button className="button button-dark" type="submit">Continue with email <ArrowRight size={16} /></button></form><div className="auth-foot"><LockKeyhole size={13} /> No password needed. This is a local demo sign-in.</div></div></div>;
  }

  function ProductModal() {
    const [quantity, setQuantity] = useState(1);
    const [reviewName, setReviewName] = useState(user?.name || '');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const product = selectedProduct;
    if (!product) return null;
    const productReviews = reviews[product.id] || [];
    const averageRating = productReviews.length
      ? (productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(1)
      : null;
    function submitReview(event) {
      event.preventDefault();
      if (!reviewRating || !reviewText.trim()) return;
      addReview(product.id, { name: reviewName.trim() || user?.name || 'RoamRider', rating: reviewRating, text: reviewText.trim() });
      setReviewText('');
      setReviewRating(0);
      setToast('Thanks for sharing your review!');
    }
    return <div className="overlay modal-overlay product-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setSelectedProduct(null)}>
      <div className="product-modal">
        <button className="modal-close" onClick={() => setSelectedProduct(null)}><X size={19} /></button>
        <div className="product-modal-image"><img src={product.image} alt={product.name} onError={(e) => { e.currentTarget.src = products[0].image; }} /><span className="product-badge">{product.badge || 'Made to roam'}</span></div>
        <div className="product-modal-copy">
          <div className="breadcrumbs">ROAMRIDE <ChevronRight size={12} /> {product.category}</div>
          <div className="product-rating">{averageRating ? <><Star size={14} fill="currentColor" /> {averageRating} <span>({productReviews.length} {productReviews.length === 1 ? 'review' : 'reviews'})</span></> : <span>New arrival · No reviews yet</span>}</div>
          <h2>{product.name}<span>.</span></h2><b className="modal-price">{money(product.price)}</b><p>{product.description}</p>
          <div className="detail-rule"></div><div className="detail-meta"><span>COLOR</span><b>{product.color}</b></div>
          {product.sizes.length > 0 && <div className="size-chooser"><span>SIZE <small>·</small> <button onClick={() => setToast('Our fit guide is coming soon.')}>Size guide</button></span><div>{product.sizes.map((size) => <button key={size} onClick={(e) => { e.currentTarget.parentElement.querySelectorAll('button').forEach((button) => button.classList.remove('chosen')); e.currentTarget.classList.add('chosen'); }}>{size}</button>)}</div></div>}
          <div className="modal-purchase"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></button></div><button className="button button-dark" onClick={() => { addToCart(product, quantity); setSelectedProduct(null); setModal('cart'); }}>Add to bag — {money(product.price * quantity)} <ShoppingBag size={16} /></button></div>
          <div className="product-promises"><span><Truck size={15} /> Free shipping over ₹10,000</span><span><BadgeCheck size={15} /> 30-day easy returns</span></div>
          <button className={`save-product ${wishlist.includes(product.id) ? 'is-saved' : ''}`} onClick={() => toggleWishlist(product)}><Heart size={16} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} /> {wishlist.includes(product.id) ? 'Saved to your wishlist' : 'Add to your wishlist'}</button>
          <section className="review-panel">
            <div className="review-panel-heading"><div><span className="eyebrow">REAL ROAMER NOTES</span><h3>Reviews <small>{productReviews.length}</small></h3></div>{averageRating && <div className="review-average"><Star size={14} fill="currentColor" /> {averageRating}<small>out of 5</small></div>}</div>
            {productReviews.length ? <div className="review-list">{productReviews.map((review, index) => <article className="review-entry" key={`${review.date}-${index}`}><div className="review-entry-top"><b>{review.name}</b><small>{new Date(review.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</small></div><div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></div><p>{review.text}</p></article>)}</div> : <div className="review-empty"><div className="review-empty-stars">☆☆☆☆☆</div><b>Be the first to leave a note.</b><span>Share how this gear fits into your journey.</span></div>}
            <form className="review-form" onSubmit={submitReview}>
              <label className="review-form-label">Your rating</label>
              <div className="review-rating-picker" role="radiogroup" aria-label="Choose a star rating">{[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} role="radio" aria-checked={reviewRating === star} aria-label={`${star} star${star === 1 ? '' : 's'}`} onClick={() => setReviewRating(star)}>{star <= reviewRating ? '★' : '☆'}</button>)}</div>
              <input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your name (optional)" aria-label="Your name" maxLength={60} />
              <textarea required value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="What should other roamers know?" aria-label="Write your review" maxLength={700} rows={3} />
              <button className="button button-dark" type="submit" disabled={!reviewRating || !reviewText.trim()}>Share your review <ArrowRight size={15} /></button>
            </form>
          </section>
        </div>
      </div>
    </div>;
  }

  function Footer() {
    return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><button className="brand" onClick={() => goTo('home')}><span className="brand-mark"><Compass size={23} /></span>ROAMRIDE<span className="brand-period">.</span></button><p>Thoughtful travel and cycling gear for wherever the road takes you.</p><span className="footer-location"><MapPin size={14} /> Made for wherever you are.</span></div><div className="footer-links"><div><b>THE GOOD STUFF</b>{['Shop all', ...categories.slice(1)].map((item) => <button key={item} onClick={() => showCatalog(item === 'Shop all' ? 'All gear' : item)}>{item}</button>)}</div><div><b>GOOD TO KNOW</b><button onClick={() => goTo('about')}>Our story</button><button onClick={() => setToast('Free shipping on orders over ₹10,000.')}>Shipping & returns</button><button onClick={() => setToast('Drop us a note at hello@roamride.example.')}>Get in touch</button><button onClick={() => setModal('auth')}>Your account</button></div></div><div className="footer-note"><Sparkles size={18} /><b>For wherever you’re headed.</b><span>Don’t forget to look up.</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to the top ↑</button></div></div><div className="footer-bottom"><span>© 2025 ROAMRIDE. Find your elsewhere.</span><span>Made with care, for the long way around. <Heart size={12} /></span><button onClick={() => goTo('admin')}>Store admin</button></div></footer>;
  }

  let content;
  switch (page) {
    case 'shop': content = <ShopPage />; break;
    case 'wishlist': content = <WishlistPage />; break;
    case 'account': content = <AccountPage />; break;
    case 'checkout': content = <CheckoutPage />; break;
    case 'confirmation': content = <ConfirmationPage />; break;
    case 'admin': content = <AdminPage />; break;
    case 'about': content = <AboutPage />; break;
    default: content = <HomePage />;
  }
  return <><Header />{content}<Footer />{modal === 'cart' && <CartDrawer />}{modal === 'auth' && <AuthModal />}{selectedProduct && <ProductModal />}{toast && <div className="toast"><Check size={16} />{toast}<button onClick={() => setToast('')}><X size={14} /></button></div>}</>;
}

export default App;

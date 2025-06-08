import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  
  // Check if user is logged in (you would typically check localStorage or context)
  React.useEffect(() => {
    const token = localStorage.getItem('salonToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('salonToken');
    localStorage.removeItem('salonUser');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <div className="hero-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <img src="/salonlogo.png" alt="Logo" className="logo" />
          <span className="brand-name">F.A. 101 Hair Salon and Spa</span>
        </div>
        <ul className="nav-links">
          <li><a href="#Home">Home</a></li>
          <li><a href="#About">About</a></li>
          <li><a href="#">Branches</a></li>
          <li className="dropdown">
            <a href="#">Our Services <span className="dropdown-icon">⌵</span></a>
            <ul className="dropdown-menu">
              <li><a href="#">Manicure & Pedicures</a></li>
              <li><a href="#">Hair Rebond</a></li>
              <li><a href="#">Hair Perming</a></li>
              <li><a href="#">Men & Women Haircut</a></li>
              <li><a href="#">Hair Color</a></li>
              <li><a href="#">Hair Rebond plus Color</a></li>
            </ul>
          </li>
          <li><a href="#Contact">Contact Us</a></li>
          <div className="auth-buttons">
            {isLoggedIn ? (
              <>
                <button className="login-button" onClick={() => navigate("/profile")}>
                  My Profile
                </button>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="login-button" onClick={() => navigate("/login")}>
                Login / Register
              </button>
            )}
          </div>
        </ul>
      </nav>

      {/* Hero Section */}
      <section id="Home" className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>READY TO <br /> REVIVE YOUR SKIN?</h1>
              <p>We Can Help...</p>
            <button className="book-now" onClick={() => navigate("/Booking")}>Book Now</button>
          </div>
        <div className="hero-image">
          <img src="/hair.jpg" alt="Hair Model" className="image" />
        </div>
        </div>
      </section>

      {/* About Section */}
      <section id="About" className="about-section">
        <h2>About Us</h2>
        <div className="about-content">
          <div className="about-images">
            <img src="/a.jpg" alt="Salon Service" className="about-img" />
            <img src="/b.jpg" alt="Hair Styling" className="about-img" />
            <img src="/c.jpg" alt="Facial Treatment" className="about-img" />
            <img src="/d.jpg" alt="Nail Service" className="about-img" />
          </div>
          <p>
          F.A Hair Salon and Spa is a premier beauty and wellness destination in the heart of Imus, Cavite,
          where elegance meets relaxation. Designed to provide a sanctuary from the stresses of daily life,
          our salon and spa offer a luxurious atmosphere where clients can unwind and indulge in top-tier beauty
          and self-care treatments. At F.A Hair Salon and Spa, we believe that beauty and wellness go hand in hand.
          Our expert team of hairstylists, estheticians, and massage therapists is dedicated to enhancing your natural
          beauty while providing a soothing and rejuvenating experience. Whether you’re looking for a stylish haircut,
          a bold new hair color, or a nourishing hair treatment, our salon professionals are committed to helping you
          achieve your desired look with precision and care. Beyond hair services, our spa treatments are designed to
          refresh both the body and mind. From deep-cleansing facials that leave your skin glowing to therapeutic massages
          that relieve tension and restore balance, we ensure that every visit is an opportunity for relaxation and renewal.
          Our nail care services also provide the perfect finishing touch, offering manicures and pedicures that keep your
          hands and feet looking polished and well-maintained. What sets F.A Hair Salon and Spa apart is our dedication to
          quality and personalized service. We take the time to understand each client's unique needs and preferences,
          ensuring a customized experience tailored to their beauty goals. Using only premium products and the latest
          techniques, we guarantee outstanding results that enhance confidence and well-being. Whether you’re preparing for
          a special event, treating yourself to a well-deserved pampering session, or simply maintaining your beauty routine,
          F.A Hair Salon and Spa is here to provide an exceptional experience. Step into our haven of relaxation and let us take
          care of you—because you deserve nothing but the best.
          </p>
        </div>
      </section>

      {/* Our Services Section */}
      <section id="OurServices" className="our-services-section">
        <div className="services-container">
          <div className="services-left">
            <h2>Our Services</h2>
          </div>
          <div className="services-right">
            <h2>Our Services</h2>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="Contact" className="contact-section">
        <div className="contact-container">
          <div className="contact-text">
            <h2>Contact Us</h2>
            <p>Hello dear customer! Ask us anything by filling out the form, we'll get back to
                you as soon as possible.</p>
                <div className="socials-image">
                  <img src="/facebook.png" alt="Facebook" className="contact-img" />
                  <img src="/insta.png" alt="Instagram" className="contact-img" />
                </div>


          </div>
          <form className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Enter your name" required />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Enter your email" required />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" required />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" placeholder="Enter your message" required></textarea>
            </div>

            <button type="submit" className="submit-button">Send Message</button>
          </form>
        </div>
      </section>
      
      {/*Footer*/}
      <section id="Footer" className="footer-section">
      <p>F.A. 101 Hair Salon and Spa @ 2013. All Rights Reserved.</p>
      </section>

    </div>
  );
};

export default LandingPage;

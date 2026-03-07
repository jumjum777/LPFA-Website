'use client';

import { useState, useEffect, useCallback } from 'react';

interface BioData {
  name: string;
  role: string;
  photo: string;
  bio: string;
}

const bios: Record<string, BioData> = {
  mullins: {
    name: 'Brad Mullins',
    role: 'Chairman',
    photo: '/images/Mullins-1-450x529.jpg',
    bio: '<p>Brad Mullins is Chief Operating Officer of Amware Companies. He provides over 22 years experience in executive management, specializing in sales and marketing, distribution, logistics, and business development. Brad is a results-oriented individual with innovative initiatives to drive growth, recognize efficiencies, implement and execute strategies associated with business plans and build strong customer relations.</p><p>His experience in business development has provided him a keen understanding of all facets of running a successful business. Brad brings a wide range of experience at an executive level with large companies like Frito-Lay, Nestle USA, and Michael Foods. His 12 years of experience with a private equity group has provided Brad with experience in purchasing companies and developing business plans to grow sales and reduce costs, making them attractive targets for an eventual acquisition.</p><p>Brad holds an undergraduate degree from Wittenberg University where he played four years of NCAA collegiate football, playing in the NCAA Division III National Championship in 1979. Brad was the defensive captain his senior year and earned multiple honors in the Ohio Athletic Conference. He was inducted into the Lorain Sports Hall of Fame in 2002.</p><p>Brad is also co-owner in a real estate management company with properties throughout the city of Lorain.</p><p>Brad commits a large portion of his free time using his business experience to sit on the Board of Directors for private companies as well as non profit organizations that include: Lorain County Board of Advisors for Junior Achievement, Board of Advisors for Teamsters Retirement Funds with 3 different locals, Board of Directors for Balanced Asset Management wealth management company, Board of Directors for Samuel Felton Foundation, and Board of Directors Vice Chair for Lorain Port Authority.</p>',
  },
  zellers: {
    name: 'Jeff Zellers',
    role: 'Vice Chairman',
    photo: '/images/JZellers-1-450x563.jpg',
    bio: '<p>A native of Westlake who has lived in Lorain since 1985, Jeff Zellers is Vice President with The Brewer-Garrett Company. He has over 37 years of experience in engineering, energy services, construction support service maintenance and accounting to produce innovative and award-winning solutions.</p><p>Jeff is actively involved in developing the correct and cost-effective solutions for customers. He assembles the team of in-house professionals who are best suited for each specific project. He continues to be engaged with the project from development through final customer acceptance and implementation.</p><p>Jeff&apos;s attention to detail, standards of quality and commitment to the client have made him a respected member of the HVAC industry. He has spoken on the benefits of Design/Build Contracting. He served as Treasurer for MCA, and has served on the Pipefitting Apprenticeship Committee and the Supplemental Unemployment Committee with Local 120 Pipefitters.</p><p>Jeff received his undergraduate degree in Industrial Technology from Ball State University. He and his wife Jane have three daughters and attend St. Anthony&apos;s Parish. For the last three years, Jeff has played an integral role in the City of Lorain&apos;s Zoning Board and Planning Commission.</p>',
  },
  jakacki: {
    name: 'Jacqueline Jakacki',
    role: 'Board Member',
    photo: '/images/JJakacki-450x562.jpg',
    bio: '<p>Jacqueline Jakacki was appointed to the port&apos;s board of directors in May 2025. She was officially sworn in by Lorain Municipal Court Judge Mark Mihok before her first board meeting on June 10.</p><p>Jakacki is a realtor and team leader for the RE/MAX Above &amp; Beyond real estate company. In addition to the port board, Jakacki also serves as an executive board member for Main Street Lorain, as a committee member for the Cinco de Mayo Parade, and as co-chair of the Pets 4 Vets Golf Outing.</p><p>Jakacki&apos;s four-year term began May 13, 2025, and continues through May 12, 2029.</p>',
  },
  kiraly: {
    name: 'Hannah Kiraly',
    role: 'Board Member',
    photo: '/images/HKiraly-1-450x562.jpg',
    bio: '<p>Hannah Kiraly was appointed to the Lorain Port and Finance Authority Board of Directors in May 2022.</p><p>With nearly a decade dedicated to urban environments, Ms. Kiraly specializes in research, analysis, and data-driven solutions for complex community challenges. Her public service experience underscores the importance of informed policy development in addressing societal issues. She serves as Program Manager overseeing the Community and Economic Development Division at the City of Lorain&apos;s Department of Building, Housing and Planning and holds positions as Board Member of the Lorain Port and Finance Authority, an Active Member of Main Street Lorain, and APA Ohio.</p><p>Ms. Kiraly earned her A.A. Degree from Cuyahoga Community College (2015), where she was named Ohio&apos;s 2015 New Century Scholar for achieving the state&apos;s top score among All-USA Community College Academic Team nominees. She pursued her passion further with a B.A. in Regional Planning and a Minor in Sustainable Urban Development from the Levin College of Urban Affairs at Cleveland State University (2017), followed by a Masters of Nonprofit Organizations from the Jack Joseph and Morton Mandel School of Applied Social Sciences at Case Western Reserve University (2021).</p><p>Throughout her academic and professional career, Ms. Kiraly has presented research at the American Association of Behavioral and Social Sciences Conference on urban environmental perspectives, served as a Panelist for Women in GIS for the Ohio Chapter of URISA, and been a guest speaker at her alma maters and local community organizations in Lorain, Ohio. In 2017, she was honored with the OCCDF Karen Kerns-Dresser Award for Public Service for her commitment and work towards increasing accessible food systems through urban agriculture in Northeast, Ohio.</p><p>Some of her career highlights include designing and implementing Master Plans, Strategic Plans, and Climate Action Plans for various jurisdictions, non-governmental agencies, nonprofits, and foundations in Northeast Ohio. She also pioneered the development and certification of the Lorain County Building Department through the Ohio Board of Building Standards and introduced the first bivariate mapping tool in Cuyahoga County to identify at-risk populations due to climate change implications.</p><p>Beyond her professional endeavors, she enjoys engaging in her photography and traveling with her husband.</p>',
  },
  scott: {
    name: 'Vassie Scott',
    role: 'Board Member',
    photo: '/images/Scott-2-450x496.jpg',
    bio: '<p>Vassie Scott was appointed to the Lorain Port and Finance Authority Board of Directors in February 2021. He was born in Elyria, Ohio, raised in Lorain, Ohio, graduated from Clearview High School, and attended the University of Dayton.</p><p>He retired from Prudential Financial after 34 years of service, and is currently a member of The Scott Group, Inc., located at 520 Broadway Avenue in Lorain, Ohio. During his career he has received several awards with the Company and industry-wide, including several President Citations, the Prudential Leaders Council Award, and Lifetime status with the Million Dollar Round Table, which is achieved by consistently performing in the top ten percent of all financial advisors worldwide. During his career, he has earned the designations of Chartered Life Underwriter (CLU), Chartered Financial Consultant (ChFC), and Accredited Estate Planner (AEP).</p><p>Having been blessed with an exceptional professional career, his passions now include being of service to our local communities and sharing his experience, strengths and hope with the youth within our community. He was past president of the Lake Erie Landlord&apos;s Association, past president of the Lorain County Board of Developmental Disabilities and was past treasurer for the Board of the Lorain County Community Action Agency. In the past, Vassie has mentored in Lorain City Schools in conjunction with the Lorain County Urban League, Elyria Salvation Army, and 100 Men of Lorain County.</p><p>He currently resides in Amherst, Ohio with his family. His personal interests include golf, chess, biking and traveling.</p>',
  },
  arredondo: {
    name: 'Michele Silva Arredondo',
    role: 'Board Member',
    photo: '/images/Silva-Arredondo-1-450x542.jpg',
    bio: '<p>Michele Silva Arredondo was appointed to the Lorain Port and Finance Authority Board of Directors in November 2022. Her term will continue through January 8, 2025.</p>',
  },
  simmons: {
    name: 'Aaron Simmons',
    role: 'Board Member',
    photo: '/images/Simmons-1-450x534.jpg',
    bio: '<p>Aaron Simmons (Jevon Terance) was appointed to the Lorain Port and Finance Authority Board of Directors May 7, 2024. His term continues through May 6, 2028.</p>',
  },
  veard: {
    name: 'Jon Veard Jr.',
    role: 'Board Member',
    photo: '/images/Veard-1-450x506.jpg',
    bio: '<p>Jon R. Veard Jr. was appointed to the Lorain Port and Finance Authority Board of Directors in June 2020. He is the owner of Veard Construction Inc. in Lorain, OH.</p>',
  },
  zgonc: {
    name: 'Alan Zgonc',
    role: 'Board Member',
    photo: '/images/AZgonc-1-450x562.jpg',
    bio: '<p>Alan Zgonc is a Lorain resident who was appointed to the Lorain Port and Finance Authority Board of Directors in January 2015. He graduated from Lorain Admiral King in 1965 and went on to study psychology at The Ohio State University.</p>',
  },
};

export default function BoardPage() {
  const [activeBio, setActiveBio] = useState<string | null>(null);

  const openBio = useCallback((key: string) => {
    setActiveBio(key);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeBio = useCallback(() => {
    setActiveBio(null);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBio();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeBio]);

  const bioData = activeBio ? bios[activeBio] : null;

  return (
    <>
      {/* BOARD */}
      <section className="section">
        <div className="container">

          {/* Officers */}
          <div className="board-officers" data-animate="fade-up">
            <div className="board-card" onClick={() => openBio('mullins')}>
              <img src="/images/Mullins-1-450x529.jpg" alt="Brad Mullins" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Brad Mullins</h4>
                <span className="board-card-role">Chairman</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
            <div className="board-card" onClick={() => openBio('zellers')}>
              <img src="/images/JZellers-1-450x563.jpg" alt="Jeff Zellers" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Jeff Zellers</h4>
                <span className="board-card-role">Vice Chairman</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
          </div>

          {/* Board Members */}
          <div className="board-grid">
            <div className="board-card" data-animate="fade-up" data-delay="0" onClick={() => openBio('jakacki')}>
              <img src="/images/JJakacki-450x562.jpg" alt="Jacqueline Jakacki" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Jacqueline Jakacki</h4>
                <span className="board-card-role">Board Member</span>
                <span className="board-card-term">Term: May 2025 &ndash; May 2029</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
            <div className="board-card" data-animate="fade-up" data-delay="100" onClick={() => openBio('kiraly')}>
              <img src="/images/HKiraly-1-450x562.jpg" alt="Hannah Kiraly" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Hannah Kiraly</h4>
                <span className="board-card-role">Board Member</span>
                <span className="board-card-term">Appointed: May 2022</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
            <div className="board-card" data-animate="fade-up" data-delay="200" onClick={() => openBio('scott')}>
              <img src="/images/Scott-2-450x496.jpg" alt="Vassie Scott" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Vassie Scott</h4>
                <span className="board-card-role">Board Member</span>
                <span className="board-card-term">Appointed: February 2021</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
            <div className="board-card" data-animate="fade-up" data-delay="0" onClick={() => openBio('arredondo')}>
              <img src="/images/Silva-Arredondo-1-450x542.jpg" alt="Michele Silva Arredondo" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Michele Silva Arredondo</h4>
                <span className="board-card-role">Board Member</span>
                <span className="board-card-term">Appointed: November 2022</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
            <div className="board-card" data-animate="fade-up" data-delay="100" onClick={() => openBio('simmons')}>
              <img src="/images/Simmons-1-450x534.jpg" alt="Aaron Simmons" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Aaron Simmons</h4>
                <span className="board-card-role">Board Member</span>
                <span className="board-card-term">Term: May 2024 &ndash; May 2028</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
            <div className="board-card" data-animate="fade-up" data-delay="200" onClick={() => openBio('veard')}>
              <img src="/images/Veard-1-450x506.jpg" alt="Jon Veard Jr." className="board-card-photo" />
              <div className="board-card-body">
                <h4>Jon Veard Jr.</h4>
                <span className="board-card-role">Board Member</span>
                <span className="board-card-term">Appointed: June 2020</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
            <div className="board-card" data-animate="fade-up" data-delay="0" onClick={() => openBio('zgonc')}>
              <img src="/images/AZgonc-1-450x562.jpg" alt="Alan Zgonc" className="board-card-photo" />
              <div className="board-card-body">
                <h4>Alan Zgonc</h4>
                <span className="board-card-role">Board Member</span>
                <span className="board-card-term">Appointed: January 2015</span>
                <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BIO MODAL */}
      <div
        className={`bio-modal-overlay${activeBio ? ' active' : ''}`}
        id="bioModal"
        onClick={(e) => { if (e.target === e.currentTarget) closeBio(); }}
      >
        <div className="bio-modal">
          <div className="bio-modal-header">
            <img
              id="bioPhoto"
              src={bioData?.photo || ''}
              alt={bioData?.name || ''}
              className="bio-modal-photo"
            />
            <div>
              <h3 id="bioName">{bioData?.name}</h3>
              <span className="board-card-role" id="bioRole">{bioData?.role}</span>
            </div>
            <button className="bio-modal-close" onClick={closeBio} aria-label="Close">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div
            className="bio-modal-content"
            id="bioContent"
            dangerouslySetInnerHTML={{ __html: bioData?.bio || '' }}
          />
        </div>
      </div>
    </>
  );
}

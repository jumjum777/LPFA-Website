-- Seed press releases from lorainport.com/news
-- Ensure 'Press Release' category exists
INSERT INTO categories (name, sort_order) VALUES ('Press Release', 10) ON CONFLICT (name) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Lorain Port and Finance Authority Moves Forward with Black River Landing Amphitheater Project',
  'lorain-port-and-finance-authority-moves-forward-with-black-river-landing-amphith',
  'Press Release',
  '2025-08-14',
  '<p>Board of Directors Approves Construction Contract with The Whiting-Turner Contracting Company; Groundbreaking Set for September 15th</p>
<p>August 14th, 2025</p>
<p>LORAIN, OHIO – The Lorain Port and Finance Authority is pleased to announce that its Board of Directors has unanimously approved a resolution to enter into a Guaranteed Maximum Price (GMP) contract with The Whiting-Turner Contracting Company for construction management services for the highly anticipated Black River Landing Amphitheater Project.</p>
<p>The resolution, passed during the Board''s August regular meeting, represents a major milestone in bringing this transformative entertainment venue to the Lake Erie shoreline. The approved GMP contract totals $6,873,039 for construction management services, marking the transition from planning to active construction phases. The Lorain Port made the decision to move forward with the dollars raised for this project to date, which is allowing them to construct the permanent stage and canopy and restructure the amphitheater lawn and front of house. Additional philanthropic commitments are still needed for the green room facility, with fundraising efforts still underway to raise those remaining dollars. It was important to make the decision to begin construction now to ensure work takes place in the off season so as to not disturb the summertime schedules.</p>
<p>"This is an exciting day for Lorain and the entire region," said Brad Mullins, Chairman of the Board of Directors. "The Black River Landing Amphitheater will be a game-changer for our community, providing a world-class entertainment venue that will attract visitors, support local businesses, and create lasting economic impact."</p>
<p>Project Background and Vision</p>
<p>Black River Landing has served as the cultural heart of Lorain since its development began in 2003. What started with a stage addition and temporary canopy top in 2006 has grown into the county''s largest destination, attracting over 150,000 visitors annually. The venue has successfully hosted festivals, concerts, and summer markets, but the original canopy from 2006 has reached the end of its lifecycle, prompting the Board of Directors to pursue a permanent, world-class amphitheater solution.</p>
<p>The new amphitheater design will include a permanent stage and top, as well as restructuring of Black River Landing to develop better sightlines of the stage, waterfront, and downtown. This strategic investment will transform the cherished waterfront space while maintaining its role as a community gathering place.</p>
<p>Currently, nearly 35% of Black River Landing''s attendees come from outside Lorain County, demonstrating the venue''s significant draw for regional tourism. The amphitheater upgrade will provide more unique experiences, improved connectivity between the waterfront and city, and activate the public space from weekend-only use to a 365-day-a-year amenity.</p>
<p>The amphitheater project has been carefully planned through extensive preconstruction work and multiple phases of development. After thorough review and consideration of all project elements, the Board determined that moving forward with The Whiting-Turner Contracting Company''s GMP proposal will ensure the highest quality construction while maintaining fiscal responsibility.</p>
<p>Construction is scheduled to begin with an official groundbreaking ceremony on September 15th, with completion targeted for spring 2026. The venue will serve as a premier destination for concerts, festivals, and community events, enhancing Lorain''s position as a cultural and entertainment hub on Lake Erie.</p>
<p>"We''re thrilled to partner with The Whiting-Turner Contracting Company, a respected leader in construction management," said Tiffany McClelland, Executive Director. "Their expertise and commitment to excellence align perfectly with our vision for this landmark project."</p>
<p>The Black River Landing Amphitheater Project represents a significant investment in Lorain''s future, designed to boost tourism, create jobs, and provide residents and visitors with exceptional entertainment experiences in a beautiful lakefront setting.</p>
<p>Additional details about the groundbreaking ceremony and project timeline will be announced in the coming weeks.</p>',
  'Board of Directors Approves Construction Contract with The Whiting-Turner Contracting Company; Groundbreaking Set for September 15th',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Notice of Special Board of Directors Meeting for the Elyria, Elyria Township, Lorain Energy Special Improvement District, Inc.',
  'notice-of-special-board-of-directors-meeting-for-the-elyria-elyria-township-lora',
  'Press Release',
  '2025-07-07',
  '<p>July 5th, 2025</p>
<p>The Board of Directors (the "Board") of the Elyria, Elyria Township, Lorain Energy Special Improvement District, Inc. (the "District") will hold a special meeting at 3:00 p.m. on Wednesday, July 9, 2025, at the Lorain Port & Finance Authority, 319 Black River Lane, Lorain, Ohio 44052.</p>
<p>The District is a nonprofit corporation created pursuant to Chapters 1702 and 1710 of the Ohio Revised Code to govern the Elyria, Elyria Township, Lorain Energy Special Improvement District. The purposes of this meeting of the Board are to: (1) consider approving a supplemental plans for certain special energy improvement projects on real property located with the City of Elyria; (2) consider approving financing documents for the financing of special energy improvement projects on real property located with the City of Elyria; (3) consider approving a virtual meeting policy; and (4) consider other business that may properly come before the Board.</p>',
  'July 5th, 2025',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Now Hiring: Manager, Project Management & Site Strategies',
  'now-hiring-manager-project-management-site-strategies',
  'Press Release',
  '2025-03-03',
  '<p>March 3rd, 2025</p>
<p>The Lorain Port Authority is seeking a strategic and results-driven professional to lead economic development initiatives, oversee property development for site readiness, and support business attraction and retention efforts.</p>
<p>Key Responsibilities:</p>
<p>• Lead development & redevelopment of port properties, with a focus on the maritime industry</p>
<p>• Identify and manage grant opportunities for economic growth</p>
<p>• Develop strategies to attract target industries and businesses</p>
<p>• Maintain and promote available sites for development</p>
<p>• Collaborate with government agencies and stakeholders to enhance economic programs</p>
<p>Ideal Candidate:</p>
<p>• Bachelor''s degree in Business, Public Administration, Economics, Planning, Real Estate, or a related field</p>
<p>• Knowledge of federal, state, and local grant programs</p>
<p>• Experience in economic development, site readiness, and government relations</p>
<p>• Strong relationship-building and community engagement skills</p>
<p>Apply Today! Submit your resume, cover letter, and references to Executive Director Tiffany McClelland at tmcclelland@lorainportauthority.com. Applications are open until filled, with the first review starting March 17, 2025.</p>',
  'March 3rd, 2025',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Lorain Hires First Femal Executive Director',
  'lorain-hires-first-femal-executive-director',
  'Press Release',
  '2024-12-11',
  '<p>December 11, 2024</p>
<p>The Lorain Port and Finance Authority (LPFA) is pleased to announce the appointment of Tiffany McClelland as its Executive Director, effective immediately. McClelland, a native of Lorain and a long-standing member of the organization, has been promoted from her previous role as Assistant Director. With over ten years of experience at the Lorain Port and Finance Authority, McClelland brings a deep understanding of economic development, port operations, and community growth. Her career at the organization began as an intern and has progressed through roles including Economic Development Specialist and Economic Development Director.</p>
<p>"Tiffany embodies the spirit and potential of the Lorain Port and Finance Authority," said Board Chairman Mullins. "Her comprehensive knowledge of our organization, combined with her proven track record of success, makes her the ideal leader to drive our mission forward."</p>
<p>McClelland''s appointment comes in the wake of the vacancy created due to Tom Brown assuming the role of Operations Director effective October 16th. McClelland served as the interim Executive Director while the Board of Directors conducted a comprehensive search for the next Executive Director. At the meeting of the Board of Directors on December 10th, 2024, the board unanimously voted to hire McClelland as the next Executive Director of the Lorain Port and Finance Authority based upon a recommendation by the search committee. This decision by the Board of Directors makes history for the agency as McClelland will be the first female director to lead the agency.</p>
<p>"I am so thankful for the faith that the Board of Directors has in me to lead this agency. I dedicate my professional growth to the opportunities I have been given by the exceptional leaders I''ve had the privilege of working with." Said McClelland "My dedication to this organization runs deep, and I''m grateful I can continue to show that through leading the port in its future endeavors."</p>
<p>A Lorain High School Salutatorian, McClelland holds a Bachelors of Arts in Public Policy and Business Studies from Bentley University, where she graduated magna cum laude. She is a Development Finance Certified Professional (DFCP).</p>
<p>The Lorain Port and Finance Authority is confident that McClelland will continue to drive economic development, promote waterborne commerce, and enhance public access to the city''s waterways.</p>',
  'December 11, 2024',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Notice of Public Hearing',
  'notice-of-public-hearing',
  'Press Release',
  '2024-12-03',
  '<p>December 3, 2024</p>
<p>NOTICE IS HEREBY GIVEN that the Lorain Port Authority (the "Port Authority") will hold a public hearing at 4:00 p.m., Eastern Time, on December 10, 2024, in the board room at 319 Black River Lane, Lorain, Ohio 44052, with respect to the proposed issuances by the Port Authority of multiple series of economic development revenue bonds as part of a plan of finance, issued separately in an aggregate principal amount not to exceed $20,000,000 (collectively, the "Bonds"), the proceeds of which will be made available to Saint Therese of Avon, LLC (the "Borrower"), an Ohio limited liability company, the sole member of which is Saint Therese Communities (the "Sole Member"), a Minnesota nonprofit corporation that has been determined by the Internal Revenue Service to be an organization described in Section 501(c)(3) of the Internal Revenue Code of 1986, as amended (the "Code").</p>
<p>The proceeds of the Bonds will be made available to the Borrower and used to (A) currently refund a portion of the $25,000,000 2024 Bridge Loan, dated December 2, 2024, from Bremer Bank, National Association, to the Borrower, which financed the costs of acquiring a portion of a continuing care retirement community located at 35755 Detroit Road, Avon, Ohio 44011, which is legally owned by the Borrower (the "Project") and (B) pay the costs of issuing each series of Bonds (collectively, the "Plan of Finance") (collectively, the "Plan of Finance").  THE PROPOSED BONDS WILL NOT CONSTITUTE GENERAL OBLIGATIONS, DEBT, OR BONDED INDEBTEDNESS, OR A PLEDGE OF THE FAITH AND CREDIT, OF THE PORT AUTHORITY, THE STATE OF OHIO, OR ANY POLITICAL SUBDIVISION THEREOF OR REQUIRE THE USE OF THE GENERAL RESOURCES OF EITHER THE PORT AUTHORITY, THE STATE, OR ANY POLITICAL SUBDIVISION THEREOF FOR THEIR PAYMENT.  RATHER, The payment of debt service on the Bonds will be paid from LOAN PAYMENTS made by the SOCIETY under a loan agreement between the Port Authority and the SOCIETY.</p>
<p>All interested persons are invited to attend such public hearing to express their views with respect to the Plan of Finance, the nature and location of the Project and the Bonds. Written comments concerning the foregoing may be submitted to the Lorain Port Authority, 319 Black River Lane, Lorain, Ohio 44052, Attn: Tiffany McClelland, on or before 4:00 p.m., Eastern Time, December 9th, 2024.</p>',
  'December 3, 2024',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Lorain Port Executive Director Shifts Roles',
  'lorain-port-executive-director-shifts-roles',
  'Press Release',
  '2024-10-15',
  '<p>The Lorain Port and Finance Authority Board of Directors met this evening to discuss the necessity of a new position at the Lorain Port. With the recent acquisition of the Rockin'' on the River asset and the redevelopment plans at Black River Landing, the need for a new position was evident. After much deliberation on organizational structure, an Operations Director job position was created by the Board. This position will be responsible for the planning, coordinating, administering, and successful execution of events at Black River Landing which includes events managed by the Port, outside event coordinators or partnerships. The employee will be responsible for the site readiness of Black River Landing and will focus efforts on improving the physical infrastructure of the site as well as the event offerings to enhance the brand of Black River Landing. It was imperative that the agency find the right fit for this position, and it was clear to them who that could be: Executive Director Tom Brown.</p>
<p>Executive Director Brown had expressed interest in this position multiple times as the agency moved in the direction of acquiring the Rockin'' on the River asset. His experience over the past seven years as the Executive Director, his relationship with Bob and Sandy Earley (previous owners of Rockin'' on the River) and his passion for being a piece of the growth and success of the City of Lorain made him the ideal candidate. The Board of Directors offered Executive Director Brown the position and he enthusiastically accepted. "I am really honored to accept this new position and truly appreciate the support of our Board of Directors." said Tom Brown, "I am looking forward to maintaining the excellence and success of Rockin'' on the River that Bob and Sandy created, while also forging new partnerships, collaborations and events at Black River Landing. We have had some great success at Black River Landing but as we enter 2025 it will be about reimagining our future and I am ready to take on this very exciting mission."</p>
<p>Board Chairman Brad Mullins expressed his excitement for this transition. "The more we talked about this position the more it became evident that Tom had interest in changing roles within the organization. His imagination, enthusiasm and knowledge of the site made our decision a little easier. We look forward to seeing what Tom brings to Black River Landing as we continue to work to enhance and improve our waterfront in Lorain."</p>
<p>Effective October 16th, 2024 Mr. Brown will assume the role of Operations Director. Due to the vacancy that this creates, the Board of Directors will immediately begin a search for the next Executive Director of the Lorain Port. While the search is underway, Assistant Director Tiffany McClelland will act as interim Executive Director.</p>
<p>Those interested in applying for the Executive Director position, please send a cover letter and resume to Brad Mullins at admin@lorainportauthority.com.</p>',
  'The Lorain Port and Finance Authority Board of Directors met this evening to discuss the necessity of a new position at the Lorain Port. With the recent acquisition of the Rockin'' on the River asset a',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Critical Repairs and a Clear Channel on the way for Lorain Harbor',
  'critical-repairs-and-a-clear-channel-on-the-way-for-lorain-harbor',
  'Press Release',
  '2024-09-12',
  '<p>Sep. 12, 2024</p>
<p>LORAIN, Ohio — The U.S. Army Corps of Engineers, Buffalo District is investing more than $14 million in breakwater repairs and dredging in Lorain Harbor.</p>
<p>Work by USACE and its contractors will ensure safe navigation for commercial and recreational vessels, prevent erosion along Ohio''s Great Lakes shoreline, and maintain the economic viability of the harbor and its historic lighthouse in the local and national economy.</p>
<p>"As communities along Lake Erie know, maintenance of the Lorain Harbor is essential to keeping our local and national economy running. I''m pleased to see these necessary improvements come to fruition as they will greatly benefit our Northern Ohio communities," said Rep. Robert Latta (OH-5).</p>
<p>"Maintaining the operation of harbors like Lorain is a core part of our mission and essential to the economic strength of the nation," said Lt. Col. Robert Burnham, USACE Buffalo District commander. "We''re proud of our partnerships with the City of Lorain, the Lorain Port and Finance Authority, the state of Ohio, and our representatives in Congress that have made this contract award possible, and we look forward to getting repairs and dredging completed on time, within budget, and effectively for the community."</p>
<p>"The Lorain Port and Finance Authority is very appreciative of the efforts of the USACE as well as our elected congressional representatives for providing the leadership and much needed funding to maintain our breakwaters, as well as maintaining a steady and effective dredge schedule," said Tom Brown, executive director of the Lorain Port and Finance Authority. "Congressman Latta has been a great leader and valued partner in advocating for these programs on behalf of our harbor. It is through support and partnerships that the Lorain Harbor remains viable for shipping and also recreational opportunities. We look forward to continued partnership and collaboration with the United States Army Corp of Engineers to continue this vital mission"</p>
<p>"The projects planned within the City of Lorain are critical to ensuring that city''s continued maritime legacy. Over the last several years, the city and our project partners have worked to design and construct the Black River Dredge Material Reuse Facility and we are thrilled to be accepting material this year. We are Lorain Proud, thankful to the U.S. Army Corps of Engineers for the major investments being made in Lorain, and look forward to years of continued partnership," said City of Lorain Mayor Jack Bradley.</p>
<p>"The Lorain Lighthouse Foundation is very pleased to see this project begin. It is a much-needed repair to ensure the viability of the Lorain Harbor. It will also ensure the Lorain Harbor Lighthouse structure will remain stable and intact for us to continue to make it available for everyone to visit this magnificent structure.  The Lighthouse was opened in 1917, closed in the mid 60''s and has been completely restored and maintained by a dedicated group of volunteers. We conduct tours, host "sunset" dinners and a variety of special events. We will work closely with the Army Corps of Engineers in any way needed," said Ron Mantini, president/treasurer of the Lorain Lighthouse Foundation.</p>
<p>Dredging of the upper channel in the Black River began on Aug. 28 and is scheduled to be completed by the end of September by Michigan-based Dean Marine and Excavating under a $4.09 million contract awarded on May 2. A total of approximately 72,000 cubic yards of material is contracted to be dredged and placed in the City of Lorain''s Black River Dredge Reuse Facility.</p>
<p>A $10.2 million contract for breakwater repairs was awarded to Michigan-based Great Lakes Dock & Materials LLC on Aug. 26. The project will repair 1,000 linear feet of the 2,812-foot-long breakwater, from Lorain''s historic harbor lighthouse inwards toward the shoreline. The repair will include a stone overlay to bring the breakwater up to its original height of 10.2 feet above low water datum, a stone stability berm extending 30 feet beyond the toe of the new overlay, and a partial wrap around the lakeward end of the breakwater. Work is expected to begin in July 2025 and will be conducted over two construction seasons, with completion by fall 2026.</p>
<p>Both projects are 100% federally funded project.</p>
<p>Breakwater repairs and dredging are being conducted by marine barges. Marine traffic will not be obstructed, but vessels should exercise caution when navigating near the breakwater and dredging vessels.</p>
<p>USACE has completed multiple maintenance projects on Lorain''s breakwaters over the last three decades. Dredging of Lorain Harbor is conducted annually, based on availability of funding. The harbor was last dredged in 2023, with 55,000 cubic yards of sediment removed.</p>
<p>Lorain Harbor is a deep draft commercial harbor which handled 897,000 tons of cargo, including limestone (84%), and salt (6%) in 2021. Waterborne transportation facilitated by the harbor supports $42.2 million in business revenue, 179 direct, indirect, and induced jobs, and $13 million in labor income to the transportation sector.</p>
<p>Operation, maintenance and dredging of harbors like Lorain by USACE is critical to the economy of Ohio, the Great Lakes region, and the United States.</p>
<p>Photos and video of Lorain Harbor are available at: https://www.flickr.com/photos/buffalousace/albums/72157719339914916/with/51222828546 and https://www.flickr.com/photos/buffalousace/albums/72177720314537134/</p>
<p>Contact: Avery Schneider, Public Affairs</p>
<p>716.879.4410 / avery.p.schneider@usace.army.mil</p>
<p>Andrew Kornacki, Public Affairs</p>
<p>716.879.4349 / andrew.a.kornacki@usace.army.mil</p>',
  'Sep. 12, 2024',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO news_articles (title, slug, category, published_date, body, excerpt, is_published)
VALUES (
  'Port Authority Purchases Rockin'' on the River – Concert Series to continue at Black River Landing.',
  'port-authority-purchases-rockin-on-the-river-concert-series-to-continue-at-black',
  'Press Release',
  '2024-09-03',
  '<p>Sep. 3, 2024</p>
<p>At a special call board meeting of the Lorain Port & Finance Authority, the Board of Directors voted to purchase the Rockin'' on the River concert series from Falls River Concerts LLC.</p>
<p>The Port has been a partner with Bob and Sandy Earley, the owners of Falls River Concerts LLC since the Summer of 2015 to provide quality entertainment at Black River Landing in an affordable, safe and secure fashion. With Bob''s announcement that he intended to retire after the 2024 season, the Port Board recognized the need to ensure that Rockin'' on the River continue at Black River Landing. Ongoing negotiations over the past two years led us to a positive agreement for both parties: Bob and Sandy get to enjoy retirement and Black River Landing retains Rockin'' on the River – a concert series that has come to mean so much to not only the citizens of Lorain, but the entire Northeast Ohio region.</p>
<p>The Port is happy to announce that in addition to acquiring the Rockin'' on the River asset, the Port also negotiated a consultation agreement with Bob and Sandy to assist the agency over the next three seasons in planning and booking the types of entertainment that Rockin'' on the River fans have come to love at Black River Landing. The Port knew how important the guidance of Bob and Sandy would be for a smooth transition of Rockin'' on the River. Port Executive Director Tom Brown said:</p>
<p>"We are so excited to ensure that Rockin'' on the River is staying here at Black River Landing. We realize a lot of our supporters have been nervous about where it might go but have remained committed to the fact that it would not be the same anywhere else. Our supporters can be assued that we will deliver the same great entertainment at an affordable price in the Summers to come. With Bob and Sandy''s continued expertise and consultation, we will be sure to continue the 10-year tradition of this wonderful concert series."</p>',
  'Sep. 3, 2024',
  true
) ON CONFLICT (slug) DO NOTHING;

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  
  // Create Platform Administrator
  console.log('🔐 Creating Platform Administrator...');
  const adminPassword = await bcrypt.hash('password', 10);
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@temple.com' },
    update: {},
    create: {
      email: 'admin@temple.com',
      password: adminPassword,
      isSuperAdmin: true,
      profile: {
        create: {
          displayName: 'Platform Administrator',
          avatarUrl: 'https://i.pravatar.cc/150?img=68',
          bio: 'Platform Administrator with full system access',
          locationCity: 'Global',
          locationCountry: 'USA',
          languages: 'en',
        },
      },
      privacySettings: {
        create: {
          showAffiliations: false,
        },
      },
      accountSettings: {
        create: {
          timezonePreference: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          languagePreference: 'en-US',
        },
      },
      notificationPreferences: {
        email: {
          newAnnouncement: true,
          newEvent: true,
          directMessage: true,
          groupChatMessage: true,
          membershipUpdate: true,
        },
      },
    },
  });
  console.log('✅ Created Platform Administrator: admin@temple.com (password: password)');
  
  console.log('\n🍩 Creating Springfield Community Church - The Simpsons Edition 🍩');

  // Create Simpsons characters as users
  const simpsonsCharacters = [
    {
      email: 'homer@simpson.com',
      password: 'doh123',
      displayName: 'Homer J. Simpson',
      bio: 'Safety Inspector at Springfield Nuclear Power Plant. Loves donuts and Duff beer. "D\'oh!"',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=33',
      isSuperAdmin: false,
    },
    {
      email: 'marge@simpson.com',
      password: 'bluebeehive',
      displayName: 'Marge Simpson',
      bio: 'Devoted wife and mother. Part-time artist and voice of reason in the family.',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=45',
      isSuperAdmin: false,
    },
    {
      email: 'bart@simpson.com',
      password: 'eatmyshorts',
      displayName: 'Bart Simpson',
      bio: '10-year-old troublemaker and proud underachiever. "Ay caramba!"',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=52',
      isSuperAdmin: false,
    },
    {
      email: 'lisa@simpson.com',
      password: 'saxophone',
      displayName: 'Lisa Simpson',
      bio: '8-year-old prodigy, vegetarian, Buddhist, and jazz saxophonist.',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=44',
      isSuperAdmin: false,
    },
    {
      email: 'ned@flanders.com',
      password: 'okily-dokily',
      displayName: 'Ned Flanders',
      bio: 'Devout Christian and Homer\'s neighbor. Owner of The Leftorium. Hi-diddly-ho!',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      isSuperAdmin: true, // Ned is the pastor/admin
    },
    {
      email: 'moe@tavern.com',
      password: 'bartender',
      displayName: 'Moe Szyslak',
      bio: 'Owner and bartender of Moe\'s Tavern. Grumpy but has a heart of gold.',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=67',
      isSuperAdmin: false,
    },
    {
      email: 'carl@nuclear.com',
      password: 'carlson',
      displayName: 'Carl Carlson',
      bio: 'Nuclear safety supervisor and Homer\'s friend. Geology enthusiast.',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=56',
      isSuperAdmin: false,
    },
    {
      email: 'lenny@nuclear.com',
      password: 'leonard',
      displayName: 'Lenny Leonard',
      bio: 'Works at the nuclear plant with Homer and Carl. Best friends with Carl.',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=14',
      isSuperAdmin: false,
    },
    {
      email: 'apu@kwik-e-mart.com',
      password: 'squishee',
      displayName: 'Apu Nahasapeemapetilon',
      bio: 'Proprietor of the Kwik-E-Mart. PhD in computer science. "Thank you, come again!"',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=60',
      isSuperAdmin: false,
    },
    {
      email: 'chief@springfield.pd',
      password: 'wiggum',
      displayName: 'Chief Clancy Wiggum',
      bio: 'Police Chief of Springfield. Loves donuts almost as much as Homer.',
      locationCity: 'Springfield',
      avatarUrl: 'https://i.pravatar.cc/150?img=15',
      isSuperAdmin: false,
    },
  ];

  const createdUsers: any = {};
  
  for (const userData of simpsonsCharacters) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPassword,
        isSuperAdmin: userData.isSuperAdmin,
        profile: {
          create: {
            displayName: userData.displayName,
            avatarUrl: userData.avatarUrl,
            bio: userData.bio,
            locationCity: userData.locationCity,
            locationCountry: 'USA',
            languages: 'en',
          },
        },
        privacySettings: {
          create: {
            showAffiliations: true,
          },
        },
        accountSettings: {
          create: {
            timezonePreference: 'America/Los_Angeles',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            languagePreference: 'en-US',
          },
        },
        notificationPreferences: {
          email: {
            newAnnouncement: true,
            newEvent: true,
            directMessage: true,
            groupChatMessage: true,
            membershipUpdate: true,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    createdUsers[userData.email] = user;
    console.log(`✅ Created user: ${userData.displayName}`);
  }

  // Create Springfield Community Church tenant
  const springfieldChurch = await prisma.tenant.upsert({
    where: { slug: 'springfield-church' },
    update: {},
    create: {
      id: 'cmi3atear0014ums4fuftaa9r',
      name: 'Springfield Community Church',
      slug: 'springfield-church',
      creed: 'Love thy neighbor (even if they borrow your stuff without asking)',
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'Unknown',
      country: 'USA',
      postalCode: '58008',
      contactEmail: 'info@springfield-church.com',
      phoneNumber: '555-PRAY',
      description: 'Welcome to Springfield Community Church! A place where everyone knows your name and occasionally your secrets. Founded in 1796, we\'ve been serving the Springfield community through thick and thin (mostly thick, thanks to Lard Lad Donuts). Join us for worship, fellowship, and the occasional town emergency!',
      branding: {
        create: {
          primaryColor: '#FFD90F', // Simpsons yellow
          accentColor: '#FF6B35', // Orange accent
          logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Simpsons_church.svg/200px-Simpsons_church.svg.png',
          bannerImageUrl: 'https://static.wikia.nocookie.net/simpsons/images/6/68/First_Church_of_Springfield.png',
          customLinks: [
            { label: 'Moe\'s Tavern', url: 'https://moes-tavern.springfield' },
            { label: 'Kwik-E-Mart', url: 'https://kwik-e-mart.springfield' },
            { label: 'Springfield Elementary', url: 'https://elementary.springfield.edu' },
          ],
        },
      },
      settings: {
        create: {
          isPublic: true,
          membershipApprovalMode: 'OPEN',
          enableCalendar: true,
          enablePosts: true,
          enableSermons: true,
          enablePodcasts: true,
          enableBooks: true,
          enableMemberDirectory: true,
          enableGroupChat: true,
          enableComments: true,
          enableReactions: true,
          enableDonations: true,
          enableVolunteering: true,
          enableSmallGroups: true,
          enableLiveStream: true,
          enablePrayerWall: true,
          enableResourceCenter: true,
          donationSettings: {
            enableRecurring: true,
            suggestedAmounts: [10, 25, 50, 100],
            paymentMethods: ['card', 'bank'],
          },
          liveStreamSettings: {
            platform: 'youtube',
            channelUrl: 'https://youtube.com/springfieldchurch',
          },
          visitorVisibility: {
            calendar: true,
            posts: true,
            sermons: true,
            podcasts: true,
            books: true,
            prayerWall: false,
          },
        },
      },
    },
  });

  console.log('✅ Springfield Community Church created!');

  console.log('🛎️ Creating featured service offerings...');
  await prisma.serviceOffering.createMany({
    data: [
      {
        tenantId: springfieldChurch.id,
        name: 'Wedding & Vow Renewal Ceremonies',
        description:
          'Pastor Ned leads joyful ceremonies for couples beginning or renewing their vows. Includes premarital sessions, customized liturgy, and optional reception planning support.',
        category: 'CEREMONY',
        isPublic: true,
        requiresBooking: true,
        pricing: 'Suggested honorarium of $250 - $400',
        order: 1,
      },
      {
        tenantId: springfieldChurch.id,
        name: 'Community Banquet Hall Rentals',
        description:
          'Reserve our fellowship hall for family reunions, banquets, and community celebrations. Includes seating for 150 guests, commercial kitchen access, and on-site host.',
        category: 'FACILITY',
        isPublic: true,
        requiresBooking: true,
        pricing: '$300 for half day / $500 full day',
        order: 2,
      },
      {
        tenantId: springfieldChurch.id,
        name: 'Pastoral Counseling & Care',
        description:
          'Confidential pastoral counseling for individuals, couples, and families navigating life transitions, grief, or spiritual questions. Sessions led by our care team and visiting chaplains.',
        category: 'COUNSELING',
        isPublic: false,
        requiresBooking: true,
        contactEmailOverride: 'care@springfield-church.com',
        order: 3,
      },
    ],
  });

  // Create memberships with roles
  const membershipData = [
    { email: 'ned@flanders.com', roles: [{ role: 'CLERGY', title: 'Pastor', primary: true }, { role: 'ADMIN', title: 'Church Administrator', primary: false }] },
    { email: 'homer@simpson.com', roles: [{ role: 'MEMBER', title: 'Congregation Member', primary: true }] },
    { email: 'marge@simpson.com', roles: [{ role: 'STAFF', title: 'Volunteer Coordinator', primary: true }, { role: 'MODERATOR', title: 'Community Moderator', primary: false }] },
    { email: 'bart@simpson.com', roles: [{ role: 'MEMBER', title: 'Youth Member', primary: true }] },
    { email: 'lisa@simpson.com', roles: [{ role: 'MEMBER', title: 'Youth Member', primary: true }] },
    { email: 'moe@tavern.com', roles: [{ role: 'MEMBER', title: 'Congregation Member', primary: true }] },
    { email: 'carl@nuclear.com', roles: [{ role: 'MEMBER', title: 'Congregation Member', primary: true }] },
    { email: 'lenny@nuclear.com', roles: [{ role: 'MEMBER', title: 'Congregation Member', primary: true }] },
    { email: 'apu@kwik-e-mart.com', roles: [{ role: 'STAFF', title: 'Outreach Coordinator', primary: true }] },
    { email: 'chief@springfield.pd', roles: [{ role: 'MEMBER', title: 'Congregation Member', primary: true }] },
  ];

  for (const memberData of membershipData) {
    const user = createdUsers[memberData.email];
    
    const membership = await prisma.userTenantMembership.upsert({
      where: {
        userId_tenantId: {
          tenantId: springfieldChurch.id,
          userId: user.id,
        },
      },
      update: {
        displayName: user.profile?.displayName,
      },
      create: {
        tenantId: springfieldChurch.id,
        userId: user.id,
        status: 'APPROVED',
        displayName: user.profile?.displayName,
      },
    });

    // Create roles
    for (const roleData of memberData.roles) {
      await prisma.userTenantRole.create({
        data: {
          membershipId: membership.id,
          role: roleData.role as any,
          displayTitle: roleData.title,
          isPrimary: roleData.primary,
        },
      });
    }

    console.log(`✅ Created membership for ${user.profile?.displayName}`);
  }

  // Create Posts (Announcements, Blogs, Books)
  const posts = [
    {
      type: 'ANNOUNCEMENT',
      title: 'Donut Sunday This Weekend!',
      body: 'Join us this Sunday after service for our famous Donut Sunday! Lard Lad Donuts has graciously donated 100 dozen donuts. Please limit yourself to a reasonable amount (yes Homer, that means you). Fellowship hall opens at 11:30 AM.',
      authorEmail: 'ned@flanders.com',
      isPublished: true,
    },
    {
      type: 'ANNOUNCEMENT',
      title: 'Church Picnic - Next Saturday',
      body: 'Our annual church picnic is coming up! Location: Springfield Park. Bring your favorite dish to share. Ned will be grilling his famous Flanders-style veggie burgers. Games, activities, and fun for the whole family!',
      authorEmail: 'marge@simpson.com',
      isPublished: true,
    },
    {
      type: 'BLOG',
      title: 'Finding Faith in Unexpected Places',
      body: 'This week, I found myself contemplating the divine while shopping at the Kwik-E-Mart. Sometimes God speaks to us in the most unexpected moments - even in the frozen foods aisle. Remember, faith isn\'t just for Sundays; it\'s for every day of the week. Stay blessed, neighbors!',
      authorEmail: 'ned@flanders.com',
      isPublished: true,
    },
    {
      type: 'BLOG',
      title: 'Why I Became a Buddhist',
      body: 'As an 8-year-old, choosing your own spiritual path isn\'t always easy, especially in Springfield. But Buddhism speaks to me - the focus on compassion, mindfulness, and non-violence aligns with my values. Plus, it doesn\'t conflict with my love of science and reason. Namaste!',
      authorEmail: 'lisa@simpson.com',
      isPublished: true,
    },
    {
      type: 'BOOK',
      title: 'The Leftorium Guide to Christian Living',
      body: 'Chapter 1: Living Right in a Left-Handed World\\n\\nFellow believers and left-handed friends! Welcome to my humble guide on integrating faith into daily life. Whether you\'re flipping pancakes or writing checks (left-handed, naturally), God\'s love surrounds us.\\n\\nChapter 2: Loving Thy Neighbor\\n\\nEven when thy neighbor borrows your power tools and never returns them (Hi-diddly-ho, Homer!), we must love unconditionally. It\'s what Jesus would do, and it\'s what we should do too.\\n\\nChapter 3: Prayer and Patience\\n\\nIn today\'s fast-paced world, taking time for prayer is essential. I recommend starting each day with a prayer and ending with gratitude. Works for me!\\n\\nOkily-dokily, may God bless you all!',
      authorEmail: 'ned@flanders.com',
      isPublished: true,
    },
  ];

  for (const postData of posts) {
    const author = createdUsers[postData.authorEmail];
    await prisma.post.create({
      data: {
        tenantId: springfieldChurch.id,
        authorUserId: author.id,
        type: postData.type,
        title: postData.title,
        body: postData.body,
        isPublished: postData.isPublished,
        publishedAt: new Date(),
      },
    });
  }
  console.log('✅ Created posts, blogs, and books');

  // Create Events for November 2025
  const events = [
    {
      title: 'Sunday Service - Finding Joy in Simple Things',
      description: 'Join Pastor Ned for an uplifting service about finding happiness in life\'s simple pleasures. Sermon title: "Okily-Dokily: The Power of Positive Thinking." Coffee and donuts after service!',
      startDateTime: new Date('2025-11-23T10:00:00'),
      endDateTime: new Date('2025-11-23T11:30:00'),
      locationText: 'Main Sanctuary',
      creatorEmail: 'ned@flanders.com',
    },
    {
      title: 'Youth Bible Study',
      description: 'Bart and Lisa lead this week\'s youth discussion on modern interpretations of ancient wisdom. Lisa will share Buddhist perspectives on compassion.',
      startDateTime: new Date('2025-11-19T18:00:00'),
      endDateTime: new Date('2025-11-19T19:30:00'),
      locationText: 'Youth Room',
      creatorEmail: 'lisa@simpson.com',
    },
    {
      title: 'Thanksgiving Potluck Dinner',
      description: 'Bring your favorite Thanksgiving dish to share! Marge is bringing her famous Thanksgiving leftover sandwiches. Sign-up sheet in the fellowship hall.',
      startDateTime: new Date('2025-11-27T17:00:00'),
      endDateTime: new Date('2025-11-27T21:00:00'),
      locationText: 'Fellowship Hall',
      creatorEmail: 'marge@simpson.com',
    },
    {
      title: 'Men\'s Prayer Breakfast',
      description: 'Monthly men\'s gathering for prayer, fellowship, and Lard Lad Donuts. This month\'s topic: "Being a Better Husband and Father" (Homer, attendance is mandatory - Love, Marge)',
      startDateTime: new Date('2025-11-21T07:00:00'),
      endDateTime: new Date('2025-11-21T08:30:00'),
      locationText: 'Fellowship Hall',
      creatorEmail: 'ned@flanders.com',
    },
    {
      title: 'Community Service Day',
      description: 'Help clean up Springfield Park! Bring gloves and rakes. Moe is providing free drinks at his tavern afterward (non-alcoholic options available).',
      startDateTime: new Date('2025-11-24T09:00:00'),
      endDateTime: new Date('2025-11-24T13:00:00'),
      locationText: 'Springfield Park',
      creatorEmail: 'apu@kwik-e-mart.com',
    },
    {
      title: 'Live Stream: Wednesday Night Worship',
      description: 'Join us online for midweek worship and reflection. Pastor Ned discusses "Technology and Faith in the Modern Age."',
      startDateTime: new Date('2025-11-20T19:00:00'),
      endDateTime: new Date('2025-11-20T20:00:00'),
      locationText: 'Online',
      isOnline: true,
      onlineUrl: 'https://youtube.com/springfieldchurch/live',
      creatorEmail: 'ned@flanders.com',
    },
  ];

  for (const eventData of events) {
    const creator = createdUsers[eventData.creatorEmail];
    await prisma.event.create({
      data: {
        tenantId: springfieldChurch.id,
        createdByUserId: creator.id,
        title: eventData.title,
        description: eventData.description,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        locationText: eventData.locationText,
        isOnline: eventData.isOnline || false,
        onlineUrl: eventData.onlineUrl || null,
      },
    });
  }
  console.log('✅ Created November 2025 events');

  // Create Media Items (Sermons and Podcasts)
  const mediaItems = [
    {
      type: 'SERMON_VIDEO',
      title: 'The Parable of the Good Samaritan... and the Bad Neighbor',
      description: 'Pastor Ned\'s sermon on loving your neighbor, featuring real-life examples from Springfield. Includes dramatic re-enactment of Homer borrowing the lawn mower.',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      authorEmail: 'ned@flanders.com',
    },
    {
      type: 'SERMON_VIDEO',
      title: 'Faith, Family, and Forgiveness',
      description: 'A heartfelt message about keeping families together through thick and thin. Marge shares her wisdom on maintaining peace in chaotic households.',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      authorEmail: 'ned@flanders.com',
    },
    {
      type: 'PODCAST_AUDIO',
      title: 'Springfield Spiritual Hour - Episode 12',
      description: 'This week: Lisa discusses the intersection of Buddhism and Western Christianity. Guest appearance by Apu sharing Hindu perspectives.',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      authorEmail: 'lisa@simpson.com',
    },
    {
      type: 'PODCAST_AUDIO',
      title: 'Dads and Donuts: A Fatherhood Podcast',
      description: 'Homer and Ned discuss the challenges of modern fatherhood. Topics: teaching kids values, setting boundaries, and when it\'s okay to bribe them with donuts.',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      authorEmail: 'homer@simpson.com',
    },
  ];

  for (const mediaData of mediaItems) {
    const author = createdUsers[mediaData.authorEmail];
    await prisma.mediaItem.create({
      data: {
        tenantId: springfieldChurch.id,
        authorUserId: author.id,
        type: mediaData.type,
        title: mediaData.title,
        description: mediaData.description,
        embedUrl: mediaData.embedUrl,
        publishedAt: new Date(),
      },
    });
  }
  console.log('✅ Created sermons and podcasts');

  // Create Conversations and Messages
  // Direct message between Homer and Marge
  const homerMargeConvo = await prisma.conversation.create({
    data: {
      tenantId: springfieldChurch.id,
      isDirectMessage: true,
      participants: {
        create: [
          { userId: createdUsers['homer@simpson.com'].id },
          { userId: createdUsers['marge@simpson.com'].id },
        ],
      },
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: homerMargeConvo.id,
        userId: createdUsers['homer@simpson.com'].id,
        text: 'Marge, do I really have to go to that prayer breakfast? Can\'t I just pray at home with a donut?',
        createdAt: new Date('2025-11-15T08:00:00'),
      },
      {
        conversationId: homerMargeConvo.id,
        userId: createdUsers['marge@simpson.com'].id,
        text: 'Homer, it\'s good for you to spend time with the men from church. Plus, Ned is counting on you.',
        createdAt: new Date('2025-11-15T08:05:00'),
      },
      {
        conversationId: homerMargeConvo.id,
        userId: createdUsers['homer@simpson.com'].id,
        text: 'Fine. But only because they have donuts. Mmm... prayer donuts...',
        createdAt: new Date('2025-11-15T08:10:00'),
      },
    ],
  });

  // Group conversation - Church Planning Committee
  const planningConvo = await prisma.conversation.create({
    data: {
      tenantId: springfieldChurch.id,
      name: 'Church Planning Committee',
      isDirectMessage: false,
      participants: {
        create: [
          { userId: createdUsers['ned@flanders.com'].id },
          { userId: createdUsers['marge@simpson.com'].id },
          { userId: createdUsers['apu@kwik-e-mart.com'].id },
        ],
      },
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: planningConvo.id,
        userId: createdUsers['ned@flanders.com'].id,
        text: 'Hi-diddly-ho, planning committee! Let\'s discuss the Thanksgiving potluck.',
        createdAt: new Date('2025-11-16T14:00:00'),
      },
      {
        conversationId: planningConvo.id,
        userId: createdUsers['marge@simpson.com'].id,
        text: 'I can coordinate the sign-up sheet. Should we have a theme this year?',
        createdAt: new Date('2025-11-16T14:05:00'),
      },
      {
        conversationId: planningConvo.id,
        userId: createdUsers['apu@kwik-e-mart.com'].id,
        text: 'I shall bring samosas and tandoori turkey! A fusion of cultures, if you will.',
        createdAt: new Date('2025-11-16T14:10:00'),
      },
      {
        conversationId: planningConvo.id,
        userId: createdUsers['ned@flanders.com'].id,
        text: 'Wonderful-diddly-onderful! The more diverse, the merrier!',
        createdAt: new Date('2025-11-16T14:12:00'),
      },
    ],
  });

  // Direct message between Bart and Lisa
  const bartLisaConvo = await prisma.conversation.create({
    data: {
      tenantId: springfieldChurch.id,
      isDirectMessage: true,
      participants: {
        create: [
          { userId: createdUsers['bart@simpson.com'].id },
          { userId: createdUsers['lisa@simpson.com'].id },
        ],
      },
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: bartLisaConvo.id,
        userId: createdUsers['bart@simpson.com'].id,
        text: 'Lisa, you\'re really leading youth Bible study? That\'s actually kinda cool.',
        createdAt: new Date('2025-11-17T16:00:00'),
      },
      {
        conversationId: bartLisaConvo.id,
        userId: createdUsers['lisa@simpson.com'].id,
        text: 'Thanks, Bart! Want to help? You could share your perspective on the parables.',
        createdAt: new Date('2025-11-17T16:05:00'),
      },
      {
        conversationId: bartLisaConvo.id,
        userId: createdUsers['bart@simpson.com'].id,
        text: 'Nah, I\'ll just come for the snacks. But I won\'t cause any trouble, I promise!',
        createdAt: new Date('2025-11-17T16:08:00'),
      },
    ],
  });

  console.log('✅ Created conversations and messages');

  // Create Small Groups
  const smallGroups = [
    {
      name: 'Men\'s Fellowship Group',
      description: 'A group for men to discuss faith, family, and life\'s challenges over coffee and donuts.',
      leaderEmail: 'ned@flanders.com',
      meetingSchedule: 'Every Thursday at 7 AM',
      members: ['homer@simpson.com', 'moe@tavern.com', 'carl@nuclear.com', 'lenny@nuclear.com'],
    },
    {
      name: 'Mom\'s Prayer Circle',
      description: 'Mothers supporting mothers through prayer and fellowship.',
      leaderEmail: 'marge@simpson.com',
      meetingSchedule: 'Every Tuesday at 10 AM',
      members: [],
    },
    {
      name: 'Youth Group',
      description: 'Fun, faith, and friendship for young people of Springfield!',
      leaderEmail: 'lisa@simpson.com',
      meetingSchedule: 'Wednesdays at 6 PM',
      members: ['bart@simpson.com'],
    },
  ];

  for (const groupData of smallGroups) {
    const leader = createdUsers[groupData.leaderEmail];
    const group = await prisma.smallGroup.create({
      data: {
        tenantId: springfieldChurch.id,
        name: groupData.name,
        description: groupData.description,
        leaderUserId: leader.id,
        meetingSchedule: groupData.meetingSchedule,
        isActive: true,
      },
    });

    // Add leader as member
    await prisma.smallGroupMembership.create({
      data: {
        groupId: group.id,
        userId: leader.id,
        role: 'LEADER',
      },
    });

    // Add other members
    for (const memberEmail of groupData.members) {
      const member = createdUsers[memberEmail];
      await prisma.smallGroupMembership.create({
        data: {
          groupId: group.id,
          userId: member.id,
          role: 'MEMBER',
        },
      });
    }
  }
  console.log('✅ Created small groups');

  // Create Community Posts (Prayer Requests)
  const communityPosts = [
    {
      type: 'PRAYER_REQUEST',
      body: 'Please pray for my family as we navigate some financial challenges. Also, if anyone knows of job openings at the nuclear plant, let me know! - Homer',
      isAnonymous: false,
      authorEmail: 'homer@simpson.com',
    },
    {
      type: 'PRAYER_REQUEST',
      body: 'Prayers needed for Springfield Elementary - we\'re facing budget cuts again.',
      isAnonymous: false,
      authorEmail: 'lisa@simpson.com',
    },
    {
      type: 'TANGIBLE_NEED',
      body: 'The Kwik-E-Mart is collecting canned goods for the local food bank. Any donations would be greatly appreciated!',
      isAnonymous: false,
      authorEmail: 'apu@kwik-e-mart.com',
    },
    {
      type: 'PRAYER_REQUEST',
      body: 'Please keep me in your prayers as I work on being more patient with Homer... I mean, with everyone.',
      isAnonymous: false,
      authorEmail: 'marge@simpson.com',
    },
  ];

  for (const postData of communityPosts) {
    const author = createdUsers[postData.authorEmail];
    await prisma.communityPost.create({
      data: {
        tenantId: springfieldChurch.id,
        authorUserId: author.id,
        type: postData.type as any,
        body: postData.body,
        isAnonymous: postData.isAnonymous,
        status: 'PUBLISHED' as any,
        createdAt: new Date(),
      },
    });
  }
  console.log('✅ Created community posts and prayer requests');

  // Create Volunteer Needs
  const volunteerNeeds = [
    {
      title: 'Sunday School Teachers Needed',
      description: 'We need volunteers to help teach Sunday school for ages 5-10. Training provided!',
      date: new Date('2025-11-23T09:00:00'),
      slotsNeeded: 3,
      signups: ['marge@simpson.com'],
    },
    {
      title: 'Park Cleanup Volunteers',
      description: 'Help us clean up Springfield Park! Bring gloves and rakes.',
      date: new Date('2025-11-24T09:00:00'),
      slotsNeeded: 10,
      signups: ['carl@nuclear.com', 'lenny@nuclear.com', 'apu@kwik-e-mart.com'],
    },
    {
      title: 'Thanksgiving Dinner Setup',
      description: 'Need help setting up tables and decorations for the potluck.',
      date: new Date('2025-11-27T15:00:00'),
      slotsNeeded: 5,
      signups: ['homer@simpson.com', 'bart@simpson.com'],
    },
  ];

  for (const needData of volunteerNeeds) {
    const need = await prisma.volunteerNeed.create({
      data: {
        tenantId: springfieldChurch.id,
        title: needData.title,
        description: needData.description,
        date: needData.date,
        slotsNeeded: needData.slotsNeeded,
      },
    });

    for (const volunteerEmail of needData.signups) {
      const volunteer = createdUsers[volunteerEmail];
      await prisma.volunteerSignup.create({
        data: {
          needId: need.id,
          userId: volunteer.id,
          status: 'CONFIRMED',
          signedUpAt: new Date(),
        },
      });
    }
  }
  console.log('✅ Created volunteer opportunities');

  // Create Donations
  const donations = [
    { donorEmail: 'homer@simpson.com', amount: 20, message: 'For the donuts fund!', isAnonymous: false },
    { donorEmail: 'marge@simpson.com', amount: 50, message: 'God bless our church community', isAnonymous: false },
    { donorEmail: 'ned@flanders.com', amount: 500, message: 'Okily-dokily, happy to help!', isAnonymous: false },
    { donorEmail: 'apu@kwik-e-mart.com', amount: 100, message: 'May this help those in need', isAnonymous: false },
    { donorEmail: 'moe@tavern.com', amount: 25, message: null, isAnonymous: true },
  ];

  for (const donationData of donations) {
    const donor = createdUsers[donationData.donorEmail];
    await prisma.donationRecord.create({
      data: {
        tenantId: springfieldChurch.id,
        userId: donor.id,
        displayName: donationData.isAnonymous ? 'Anonymous' : donor.profile?.displayName || 'Unknown',
        amount: donationData.amount,
        currency: 'USD',
        message: donationData.message,
        isAnonymousOnLeaderboard: donationData.isAnonymous,
        donatedAt: new Date(),
      },
    });
  }
  console.log('✅ Created donation records');

  // Create Resource Items
  const resources = [
    {
      title: 'Church Membership Handbook',
      description: 'Everything you need to know about being part of Springfield Community Church',
      fileUrl: 'https://example.com/resources/membership-handbook.pdf',
      fileType: 'PDF',
      uploaderEmail: 'ned@flanders.com',
      visibility: 'PUBLIC',
    },
    {
      title: 'Youth Group Activities Guide',
      description: 'Fun activities and discussion topics for youth leaders',
      fileUrl: 'https://example.com/resources/youth-activities.pdf',
      fileType: 'PDF',
      uploaderEmail: 'lisa@simpson.com',
      visibility: 'MEMBERS_ONLY',
    },
    {
      title: 'Springfield Church History',
      description: 'A historical overview of our church from 1796 to present',
      fileUrl: 'https://example.com/resources/church-history.pdf',
      fileType: 'PDF',
      uploaderEmail: 'ned@flanders.com',
      visibility: 'PUBLIC',
    },
  ];

  for (const resourceData of resources) {
    const uploader = createdUsers[resourceData.uploaderEmail];
    await prisma.resourceItem.create({
      data: {
        tenantId: springfieldChurch.id,
        uploaderUserId: uploader.id,
        title: resourceData.title,
        description: resourceData.description,
        fileUrl: resourceData.fileUrl,
        fileType: resourceData.fileType as any,
        visibility: resourceData.visibility as any,
        createdAt: new Date(),
      },
    });
  }
  console.log('✅ Created resource items');

  // Create Contact Submissions
  const contactSubmissions = [
    {
      name: 'Hans Moleman',
      email: 'hans@springfield.com',
      message: 'I\'d like to inquire about joining the church. Also, do you have wheelchair access?',
      status: 'UNREAD',
    },
    {
      name: 'Comic Book Guy',
      email: 'comic@androidsdungeon.com',
      message: 'Worst church website ever! Just kidding, it\'s actually pretty good. Can I get info on your theology book club?',
      status: 'READ',
    },
  ];

  for (const submissionData of contactSubmissions) {
    await prisma.contactSubmission.create({
      data: {
        tenantId: springfieldChurch.id,
        name: submissionData.name,
        email: submissionData.email,
        message: submissionData.message,
        status: submissionData.status as any,
        createdAt: new Date(),
      },
    });
  }
  console.log('✅ Created contact submissions');

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: createdUsers['homer@simpson.com'].id,
        actorUserId: createdUsers['marge@simpson.com'].id,
        type: 'NEW_DIRECT_MESSAGE',
        message: 'Marge sent you a message',
        link: `/messages`,
        isRead: false,
        createdAt: new Date(),
      },
      {
        userId: createdUsers['ned@flanders.com'].id,
        type: 'NEW_CONTACT_SUBMISSION',
        message: 'New contact form submission from Hans Moleman',
        link: `/admin/contacts`,
        isRead: false,
        createdAt: new Date(),
      },
      {
        userId: createdUsers['lisa@simpson.com'].id,
        actorUserId: createdUsers['bart@simpson.com'].id,
        type: 'NEW_DIRECT_MESSAGE',
        message: 'Bart sent you a message',
        link: `/messages`,
        isRead: true,
        createdAt: new Date(),
      },
    ],
  });
  console.log('✅ Created notifications');

  console.log('\n🎉 Springfield Community Church seed completed!');
  console.log('📍 Tenant Slug: springfield-church');
  console.log('\n👑 PLATFORM ADMINISTRATOR:');
  console.log('   Email: admin@temple.com');
  console.log('   Password: password');
  console.log('   Role: Super Admin (Full Platform Access)');
  console.log('\n👤 TENANT USERS:');
  console.log('   Pastor/Admin: ned@flanders.com (password: okily-dokily)');
  console.log('   Test User: homer@simpson.com (password: doh123)');
  console.log('   Test User: marge@simpson.com (password: bluebeehive)');
  console.log('🍩 D\'oh! The database is ready for testing!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });


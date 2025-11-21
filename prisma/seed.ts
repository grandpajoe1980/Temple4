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
          autoApprovePrayerWall: false,
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
  
    // --- Seed: Small Groups ---
    console.log('\n📚 Creating sample small groups...');
  
    // Neighborhood Book Club - leader: ned@flanders.com
    const bookClub = await prisma.smallGroup.upsert({
      where: { slug: 'neighborhood-book-club' },
      update: {},
      create: {
        tenantId: springfieldChurch.id,
        name: 'Neighborhood Book Club',
        slug: 'neighborhood-book-club',
        description: 'Monthly book discussion; all are welcome.',
        leaderUserId: createdUsers['ned@flanders.com'].id,
        joinPolicy: 'APPROVAL',
        isPublic: true,
        capacity: 20,
        tags: JSON.stringify(['books','discussion','monthly']),
        createdByUserId: createdUsers['ned@flanders.com'].id,
      },
    });
  
    // Ensure leader is a member (approved)
    try {
      await prisma.smallGroupMembership.create({
        data: {
          groupId: bookClub.id,
          userId: createdUsers['ned@flanders.com'].id,
          role: 'LEADER',
          status: 'APPROVED',
          addedByUserId: createdUsers['ned@flanders.com'].id,
        }
      });
    } catch (e) {
      // ignore unique constraint errors
    }
  
    // Young Families Playgroup - leader: marge@simpson.com
    const playgroup = await prisma.smallGroup.upsert({
      where: { slug: 'young-families-playgroup' },
      update: {},
      create: {
        tenantId: springfieldChurch.id,
        name: 'Young Families Playgroup',
        slug: 'young-families-playgroup',
        description: 'Weekly meetups for families with young children.',
        leaderUserId: createdUsers['marge@simpson.com'].id,
        joinPolicy: 'OPEN',
        isPublic: false,
        capacity: 12,
        tags: JSON.stringify(['families','playgroup']),
        createdByUserId: createdUsers['marge@simpson.com'].id,
      },
    });
  
    // Add a few members
    const addMembership = async (groupId: string, userEmail: string, role = 'MEMBER') => {
      const user = createdUsers[userEmail];
      if (!user) return;
      try {
        await prisma.smallGroupMembership.create({
          data: {
            groupId,
            userId: user.id,
            role: role as any,
            status: 'APPROVED',
            addedByUserId: createdUsers['marge@flanders.com'].id,
          }
        });
      } catch (e) {
        // ignore
      }
    };
  
    await addMembership(playgroup.id, 'homer@simpson.com');
    await addMembership(playgroup.id, 'bart@simpson.com');
    await addMembership(playgroup.id, 'lisa@simpson.com');
  
    console.log('✅ Sample small groups created.');

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
      scope: 'TENANT',
      kind: 'DM',
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
      scope: 'TENANT',
      kind: 'GROUP',
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
      scope: 'TENANT',
      kind: 'DM',
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

  console.log('\n✅ Created notifications');

  // --- Add facility data for Springfield Community Church ---
  console.log('\n🏛️ Adding facilities for Springfield Community Church...');
  await prisma.facility.createMany({
    data: [
      {
        tenantId: springfieldChurch.id,
        name: 'Main Sanctuary',
        description: 'Primary worship space with pulpit, seating for 200, and AV system.',
        type: 'HALL',
        capacity: 200,
        imageUrl: 'https://i.imgur.com/8Km9tLL.jpg',
      },
      {
        tenantId: springfieldChurch.id,
        name: 'Fellowship Hall',
        description: 'Multi-purpose hall for meals, meetings and events. Seats 150.',
        type: 'HALL',
        capacity: 150,
        imageUrl: 'https://i.imgur.com/0y0y0y0.jpg',
      },
      {
        tenantId: springfieldChurch.id,
        name: 'Youth Room',
        description: 'Small meeting room for youth group and classes.',
        type: 'ROOM',
        capacity: 30,
        imageUrl: 'https://i.pravatar.cc/300?img=5',
      },
    ],
  });
  console.log('✅ Springfield facilities added');

  // --- Game of Thrones themed tenant seed (hotlinked images from fandom) ---
  console.log('\n⚔️ Creating Game of Thrones themed tenant and members...');

  const gotCharacters = [
    { email: 'jon@got.example', password: 'winter123', displayName: 'Jon Snow', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/d/d0/JonSnow8x06.PNG/revision/latest?cb=20190714094440', bio: 'Raised at Winterfell; committed to protecting the realms of men.', locationCity: 'Winterfell', locationCountry: 'Westeros' },
    { email: 'daenerys@got.example', password: 'dragon123', displayName: 'Daenerys Targaryen', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/9/91/Dany_Drogon_Jorah_S3_Ep1.jpg/revision/latest?cb=20130402130943', bio: 'Breaker of chains, seeker of justice and dragons.', locationCity: 'Dragonstone', locationCountry: 'Westeros' },
    { email: 'tyrion@got.example', password: 'clever123', displayName: 'Tyrion Lannister', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/d/d2/Tyrion_S2Promo.jpg/revision/latest?cb=20120323183758', bio: 'Witty scholar and strategist; fond of books and wine.', locationCity: "King's Landing", locationCountry: 'Westeros' },
    { email: 'sansa@got.example', password: 'lady123', displayName: 'Sansa Stark', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/4/4d/Sansa_Season6.png/revision/latest?cb=20160610123456', bio: 'Political mind and steward of northern traditions.', locationCity: 'Winterfell', locationCountry: 'Westeros' },
    { email: 'arya@got.example', password: 'needle123', displayName: 'Arya Stark', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/1/1b/Arya_S8.png/revision/latest?cb=20190423165940', bio: 'Skilled and resourceful; on a journey of her own.', locationCity: 'The Riverlands', locationCountry: 'Westeros' },
    { email: 'bran@got.example', password: 'seer123', displayName: 'Bran Stark', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/7/7b/Bran_S8.png/revision/latest?cb=20190423165942', bio: 'The mystic who remembers the past and sees beyond.', locationCity: 'Winterfell', locationCountry: 'Westeros' },
    { email: 'cersei@got.example', password: 'queen123', displayName: 'Cersei Lannister', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/5/51/Winter_is_Coming_Jaime_and_Cersei.png/revision/latest?cb=20130605013757', bio: 'A cunning and determined leader from House Lannister.', locationCity: "King's Landing", locationCountry: 'Westeros' },
    { email: 'jaime@got.example', password: 'kingslayer', displayName: 'Jaime Lannister', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/d/d8/No_One_23.jpg/revision/latest?cb=20160614171036', bio: 'Knight with a complicated past; protector and warrior.', locationCity: "King's Landing", locationCountry: 'Westeros' },
    { email: 'samwell@got.example', password: 'maester123', displayName: 'Samwell Tarly', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/0/05/GOT_Season_5_02.jpg/revision/latest?cb=20150409231553', bio: 'Scholar and lit lover; keeper of knowledge and recipes.', locationCity: 'Horn Hill', locationCountry: 'Westeros' },
    { email: 'brienne@got.example', password: 'oathkeeper', displayName: 'Brienne of Tarth', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/a/a9/S8_Brienne_Profil.jpg/revision/latest?cb=20190423165941', bio: 'Honorable warrior sworn to keep promises and protect the innocent.', locationCity: 'Tarth', locationCountry: 'Westeros' },
    { email: 'jorah@got.example', password: 'exile123', displayName: 'Jorah Mormont', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/9/91/Dany_Drogon_Jorah_S3_Ep1.jpg/revision/latest?cb=20130402130943', bio: 'Loyal yet exiled knight seeking redemption.', locationCity: 'Bear Island', locationCountry: 'Westeros' },
    { email: 'theon@got.example', password: 'reek123', displayName: 'Theon Greyjoy', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/8/81/Theon_Greyjoy.png/revision/latest?cb=20110302142633', bio: 'A man torn between families and seeking to find his place.', locationCity: 'Pyke', locationCountry: 'Westeros' },
    { email: 'davos@got.example', password: 'onion123', displayName: 'Davos Seaworth', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/7/7a/707_Qhono_Davos_Podrick_Theon_Jon_Varys_Tyrion_Bronn.jpg/revision/latest?cb=20170828114500', bio: 'Practical and honest; a smuggler turned trusted advisor.', locationCity: 'White Harbor', locationCountry: 'Westeros' },
    { email: 'melisandre@got.example', password: 'redwoman', displayName: 'Melisandre', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/9/9a/The_Red_Woman_08.jpg/revision/latest?cb=20160421170246', bio: 'Mysterious priestess with a prophetic calling.', locationCity: 'Asshai', locationCountry: 'Essos' },
    { email: 'stannis@got.example', password: 'iron123', displayName: 'Stannis Baratheon', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/1/11/Book_of_the_Stranger_14.jpg/revision/latest?cb=20160512165557', bio: 'Staunch leader with a rigid sense of duty.', locationCity: 'Dragonstone', locationCountry: 'Westeros' },
    { email: 'petyr@got.example', password: 'littlefinger', displayName: 'Petyr Baelish', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/5/55/Roman_Papsuev_-_Petyr_Baelish.png/revision/latest?cb=20230701112254', bio: 'A schemer and merchant of whispers.', locationCity: 'The Fingers', locationCountry: 'Westeros' },
    { email: 'varys@got.example', password: 'whispers', displayName: 'Varys', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/e/e4/Varys_S2.jpg/revision/latest?cb=20120324133826', bio: 'Master of whispers; information broker across the realms.', locationCity: "King's Landing", locationCountry: 'Westeros' },
    { email: 'drogo@got.example', password: 'khaleesi', displayName: 'Khal Drogo', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/9/9f/Khal_Drogo_Profile.jpg/revision/latest?cb=20110302150000', bio: 'Fearsome khal of the Dothraki khalasar.', locationCity: 'Dothraki Sea', locationCountry: 'Essos' },
    { email: 'margaery@got.example', password: 'rose123', displayName: 'Margaery Tyrell', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/b/b5/Margaery_Tyrell_S6.png/revision/latest?cb=20210722163311', bio: 'Charming and politically savvy; master of public relations.', locationCity: 'Highgarden', locationCountry: 'Westeros' },
    { email: 'olenna@got.example', password: 'thorn123', displayName: 'Olenna Tyrell', avatarUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/3/33/Olenna_Tyrell_Profile.jpg/revision/latest?cb=20160512170000', bio: 'Sharp-tongued matriarch and respected elder.', locationCity: 'Highgarden', locationCountry: 'Westeros' },
  ];

  for (const char of gotCharacters) {
    const hashed = await bcrypt.hash(char.password, 10);
    const user = await prisma.user.upsert({
      where: { email: char.email },
      update: {
        // ensure existing users get their profile avatar and bio updated
        profile: {
          upsert: {
            create: { displayName: char.displayName, avatarUrl: char.avatarUrl, locationCity: char.locationCity || 'Westeros', locationCountry: char.locationCountry || null, bio: (char as any).bio || null },
            update: { avatarUrl: char.avatarUrl, displayName: char.displayName, bio: (char as any).bio || undefined, locationCity: char.locationCity || undefined, locationCountry: char.locationCountry || undefined },
          },
        },
      },
      create: {
        email: char.email,
        password: hashed,
        profile: { create: { displayName: char.displayName, avatarUrl: char.avatarUrl, locationCity: 'Westeros' } },
        privacySettings: { create: { showAffiliations: true } },
        accountSettings: { create: { timezonePreference: 'UTC', languagePreference: 'en-US' } },
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
      include: { profile: true },
    });
    createdUsers[char.email] = user;
    console.log(`✅ GOT user created: ${char.displayName}`);
  }

  // Create GOT tenant
  const gotTenant = await prisma.tenant.upsert({
    where: { slug: 'game-of-thrones' },
    update: {},
    create: {
      name: 'Game of Thrones Fellowship',
      slug: 'game-of-thrones',
      creed: 'United by story, fellowship, and fan community.',
      street: 'Castle Way',
      city: 'Winterfell',
      state: 'The North',
      country: 'Westeros',
      postalCode: '00001',
      contactEmail: 'info@got-fellowship.example',
      phoneNumber: '+000-000-0000',
      description: 'A fan fellowship celebrating the world of Westeros with events, discussions and creative groups.',
      branding: {
        create: {
          primaryColor: '#2B3A67',
          accentColor: '#C6A25C',
          logoUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/d/dd/HBO.png/revision/latest?cb=20230112120342',
          bannerImageUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/9/91/Daenerys_202.jpg/revision/latest?cb=20120221232427',
        },
      },
      settings: {
        create: {
          isPublic: true,
          membershipApprovalMode: 'OPEN',
          enableCalendar: true,
          enablePosts: true,
          enableMemberDirectory: true,
          enableGroupChat: true,
          enableComments: true,
          enableReactions: true,
          enableServices: true,
          enableSmallGroups: true,
          enableResourceCenter: true,
          donationSettings: { enableRecurring: false, suggestedAmounts: [10, 25, 50], paymentMethods: ['card'] },
          liveStreamSettings: { platform: 'youtube', channelUrl: null },
          visitorVisibility: { calendar: true, posts: true, prayerWall: false },
        },
      },
    },
  });

  // Create service offerings for GOT fellowship
  await prisma.serviceOffering.createMany({
    data: [
      { tenantId: gotTenant.id, name: 'Lore Discussion Evenings', description: 'Weekly moderated lore discussion and Q&A sessions.', category: 'EDUCATION', isPublic: true, requiresBooking: false, order: 1 },
      { tenantId: gotTenant.id, name: 'Costume & Prop Rentals', description: 'On-site costume and prop lending for events and contests.', category: 'FACILITY', isPublic: true, requiresBooking: true, pricing: 'Donation', order: 2 },
      { tenantId: gotTenant.id, name: 'Fan Workshop — Worldbuilding', description: 'Hands-on workshops about worldbuilding, craft, and prop making.', category: 'EDUCATION', isPublic: true, requiresBooking: true, order: 3 },
    ],
  });

  // Add facilities for GOT tenant
  await prisma.facility.createMany({
    data: [
      { tenantId: gotTenant.id, name: 'Great Hall', description: 'Large hall for feasts and gatherings.', type: 'HALL', capacity: 300, imageUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/4/47/GreatHall_Winterfell.jpg/revision/latest?cb=20131201000000' },
      { tenantId: gotTenant.id, name: 'Library of Lore', description: 'Extensive collection of books, scrolls and maps.', type: 'ROOM', capacity: 80, imageUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/2/2a/Library_Winterfell.jpg/revision/latest?cb=20131201000001' },
      { tenantId: gotTenant.id, name: 'Training Yard', description: 'Space for workshops, costuming and rehearsal.', type: 'OTHER', capacity: 60, imageUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/7/70/Training_Yard.jpg/revision/latest?cb=20131201000002' },
    ],
  });

  // Create Small Groups for GOT tenant
  const gotSmallGroups = [
    { name: 'House Readers', description: 'Weekly book club exploring lore and in-universe histories.', leaderEmail: 'tyrion@got.example', members: ['margaery@got.example', 'petyr@got.example', 'varys@got.example'] },
    { name: 'Combat Choreography', description: 'Practice sessions for staged combat and prop safety.', leaderEmail: 'brienne@got.example', members: ['jaime@got.example', 'jon@got.example', 'jorah@got.example'] },
    { name: 'Costume Makers', description: 'Sewing, armor-building and prop-making workshops.', leaderEmail: 'margaery@got.example', members: ['olenna@got.example', 'daenerys@got.example', 'melisandre@got.example'] },
  ];

  for (const g of gotSmallGroups) {
    const leader = createdUsers[g.leaderEmail];
    const group = await prisma.smallGroup.create({ data: { tenantId: gotTenant.id, name: g.name, description: g.description, leaderUserId: leader.id, meetingSchedule: 'Bi-weekly', isActive: true } });
    await prisma.smallGroupMembership.create({ data: { groupId: group.id, userId: leader.id, role: 'LEADER' } });
    for (const m of g.members) {
      const member = createdUsers[m];
      if (member) await prisma.smallGroupMembership.create({ data: { groupId: group.id, userId: member.id, role: 'MEMBER' } });
    }
  }

  // Add more resource items and books for GOT tenant
  const gotExtraResources = [
    { title: 'Annotated Song of Ice and Fire - Fan Edition', description: 'Community-compiled annotations and discussion prompts.', fileUrl: 'https://example.com/got/annotated-soiaf.pdf', uploader: 'tyrion@got.example' },
    { title: 'House Sigils High-Res Pack', description: 'High-resolution sigils for printing and decorations.', fileUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/0/0f/House_sigils_sample.pdf', uploader: 'margaery@got.example' },
    { title: 'Costume Patterns Vol.1', description: 'Basic sewing patterns for beginner cosplayers.', fileUrl: 'https://example.com/got/costume-patterns.pdf', uploader: 'margaery@got.example' },
  ];
  for (const r of gotExtraResources) {
    const upl = createdUsers[r.uploader];
    if (upl) await prisma.resourceItem.create({ data: { tenantId: gotTenant.id, uploaderUserId: upl.id, title: r.title, description: r.description, fileUrl: r.fileUrl, fileType: 'PDF', visibility: 'PUBLIC' } });
  }

  // Add GOT books (as BOOK posts)
  const gotBooks = [
    { title: 'Fellowship Compendium', body: 'A fan-compiled companion guide to our events and lore sessions.', author: 'tyrion@got.example' },
    { title: 'Feasts & Recipes of Westeros', body: 'A community cookbook inspired by the series.', author: 'davos@got.example' },
    { title: 'Constructing Costumes', body: 'Techniques and tutorials for realistic costume work.', author: 'margaery@got.example' },
  ];
  for (const b of gotBooks) {
    const au = createdUsers[b.author];
    if (au) await prisma.post.create({ data: { tenantId: gotTenant.id, authorUserId: au.id, type: 'BOOK', title: b.title, body: b.body, isPublished: true, publishedAt: new Date() } });
  }

  // Add more chat messages and threads between GOT members
  const tAndV = await prisma.conversation.create({ data: { tenantId: gotTenant.id, isDirectMessage: true, scope: 'TENANT', kind: 'DM', participants: { create: [{ userId: createdUsers['tyrion@got.example'].id }, { userId: createdUsers['varys@got.example'].id }] } } });
  await prisma.chatMessage.createMany({ data: [
    { conversationId: tAndV.id, userId: createdUsers['tyrion@got.example'].id, text: 'Varys, your informants have anything on the costume contest judges?', createdAt: new Date() },
    { conversationId: tAndV.id, userId: createdUsers['varys@got.example'].id, text: 'Pleasantly predictable. I have suggestions; meet me at the library.', createdAt: new Date() },
  ] });

  const aryaSansa = await prisma.conversation.create({ data: { tenantId: gotTenant.id, isDirectMessage: true, scope: 'TENANT', kind: 'DM', participants: { create: [{ userId: createdUsers['arya@got.example'].id }, { userId: createdUsers['sansa@got.example'].id }] } } });
  await prisma.chatMessage.createMany({ data: [
    { conversationId: aryaSansa.id, userId: createdUsers['arya@got.example'].id, text: 'Sansa, I found a pattern for a cloak you might like.', createdAt: new Date() },
    { conversationId: aryaSansa.id, userId: createdUsers['sansa@got.example'].id, text: 'Send it over; we can adapt it for the Winterfell theme.', createdAt: new Date() },
  ] });

  const jonSam = await prisma.conversation.create({ data: { tenantId: gotTenant.id, isDirectMessage: true, scope: 'TENANT', kind: 'DM', participants: { create: [{ userId: createdUsers['jon@got.example'].id }, { userId: createdUsers['samwell@got.example'].id }] } } });
  await prisma.chatMessage.createMany({ data: [
    { conversationId: jonSam.id, userId: createdUsers['samwell@got.example'].id, text: 'Jon, I found new references in the old annals about the Long Night.', createdAt: new Date() },
    { conversationId: jonSam.id, userId: createdUsers['jon@got.example'].id, text: 'Bring them to the Lore Discussion; we should prepare talking points.', createdAt: new Date() },
  ] });

  // Upsert memberships and roles for GOT users
  for (let i = 0; i < gotCharacters.length; i++) {
    const char = gotCharacters[i];
    const user = createdUsers[char.email];
    const membership = await prisma.userTenantMembership.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: gotTenant.id } },
      update: { displayName: user.profile?.displayName },
      create: { tenantId: gotTenant.id, userId: user.id, status: 'APPROVED', displayName: user.profile?.displayName },
    });

    // Assign roles with variety
    const roles = [];
    if (i === 0) roles.push({ role: 'ADMIN', title: 'Lord Commander', primary: true });
    else if (i < 4) roles.push({ role: 'STAFF', title: 'Organizer', primary: true });
    else roles.push({ role: 'MEMBER', title: 'Member', primary: true });

    for (const r of roles) {
      await prisma.userTenantRole.create({ data: { membershipId: membership.id, role: r.role as any, displayTitle: r.title, isPrimary: r.primary } });
    }
  }

  // Create at least 3 posts, events, resources, media items for GOT tenant
  const gotPosts = [
    { type: 'ANNOUNCEMENT', title: 'Feast of Houses — Fan Meetup', body: 'Join us for a themed feast and house competitions.', authorEmail: 'jon@got.example' },
    { type: 'BLOG', title: 'A Reader\'s Guide to Westeros', body: 'Weekly deep dives into the lore and histories.', authorEmail: 'tyrion@got.example' },
    { type: 'ANNOUNCEMENT', title: 'Costume Contest Rules', body: 'Rules and registration for the upcoming costume contest.', authorEmail: 'margaery@got.example' },
  ];
  for (const p of gotPosts) {
    const author = createdUsers[p.authorEmail];
    await prisma.post.create({ data: { tenantId: gotTenant.id, authorUserId: author.id, type: p.type, title: p.title, body: p.body, isPublished: true, publishedAt: new Date() } });
  }

  const gotEvents = [
    { title: 'Feast of Houses', description: 'A themed community feast with house competitions.', start: new Date('2025-12-06T18:00:00'), end: new Date('2025-12-06T22:00:00'), creator: 'jon@got.example' },
    { title: 'Lore Discussion: The Long Night', description: 'Panel discussion and Q&A.', start: new Date('2025-12-10T19:00:00'), end: new Date('2025-12-10T21:00:00'), creator: 'daenerys@got.example' },
    { title: 'Costume Workshop', description: 'Build and prep for the costume contest.', start: new Date('2025-12-03T10:00:00'), end: new Date('2025-12-03T13:00:00'), creator: 'margaery@got.example' },
  ];
  for (const e of gotEvents) {
    const creator = createdUsers[e.creator];
    await prisma.event.create({ data: { tenantId: gotTenant.id, createdByUserId: creator.id, title: e.title, description: e.description, startDateTime: e.start, endDateTime: e.end, locationText: 'Great Hall' } });
  }

  const gotResources = [
    { title: 'House Sigils PDF', description: 'Printable house sigils for decorations.', fileUrl: 'https://static.wikia.nocookie.net/gameofthrones/images/0/0f/House_sigils_sample.pdf', uploader: 'tyrion@got.example' },
    { title: 'Lore Night Slides', description: 'Slides for the Long Night discussion.', fileUrl: 'https://example.com/got/lore-slides.pdf', uploader: 'jon@got.example' },
    { title: 'Costume Checklist', description: 'Checklist and suppliers for costume builds.', fileUrl: 'https://example.com/got/costume-checklist.pdf', uploader: 'margaery@got.example' },
  ];
  for (const r of gotResources) {
    const upl = createdUsers[r.uploader];
    await prisma.resourceItem.create({ data: { tenantId: gotTenant.id, uploaderUserId: upl.id, title: r.title, description: r.description, fileUrl: r.fileUrl, fileType: 'PDF', visibility: 'PUBLIC' } });
  }

  const gotMedia = [
    { type: 'PODCAST_AUDIO', title: 'Tales From Westeros - Ep1', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', author: 'tyrion@got.example' },
    { type: 'SERMON_VIDEO', title: 'Fireside Chat: The North', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', author: 'jon@got.example' },
    { type: 'PODCAST_AUDIO', title: 'Costume Makers Roundtable', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', author: 'margaery@got.example' },
  ];
  for (const m of gotMedia) {
    const au = createdUsers[m.author];
    await prisma.mediaItem.create({ data: { tenantId: gotTenant.id, authorUserId: au.id, type: m.type, title: m.title, description: '', embedUrl: m.embedUrl, publishedAt: new Date() } });
  }

  // Conversations/messages — a few sample threads
  const convoA = await prisma.conversation.create({ data: { tenantId: gotTenant.id, isDirectMessage: true, scope: 'TENANT', kind: 'DM', participants: { create: [{ userId: createdUsers['jon@got.example'].id }, { userId: createdUsers['daenerys@got.example'].id }] } } });
  await prisma.chatMessage.createMany({ data: [ { conversationId: convoA.id, userId: createdUsers['jon@got.example'].id, text: 'Ready for the Feast of Houses?', createdAt: new Date() }, { conversationId: convoA.id, userId: createdUsers['daenerys@got.example'].id, text: 'I will bring dragons (metaphorically).', createdAt: new Date() }, { conversationId: convoA.id, userId: createdUsers['jon@got.example'].id, text: 'Metaphorical dragons are still impressive.', createdAt: new Date() } ] });

  const committee = await prisma.conversation.create({ data: { tenantId: gotTenant.id, name: 'Feast Planning Committee', isDirectMessage: false, scope: 'TENANT', kind: 'GROUP', participants: { create: [ { userId: createdUsers['tyrion@got.example'].id }, { userId: createdUsers['margaery@got.example'].id }, { userId: createdUsers['varys@got.example'].id } ] } } });
  await prisma.chatMessage.createMany({ data: [ { conversationId: committee.id, userId: createdUsers['tyrion@got.example'].id, text: 'We need better napkin placement.', createdAt: new Date() }, { conversationId: committee.id, userId: createdUsers['margaery@got.example'].id, text: 'I will coordinate decor and judges.', createdAt: new Date() }, { conversationId: committee.id, userId: createdUsers['varys@got.example'].id, text: 'I have informants in the kitchens.', createdAt: new Date() } ] });

  console.log('🎭 Game of Thrones tenant and sample content seeded.');

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


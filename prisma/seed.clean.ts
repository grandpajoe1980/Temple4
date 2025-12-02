import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper functions
const hashPassword = async (password: string) => bcrypt.hash(password, 10);

const createUser = async (email: string, displayName: string, avatarUrl: string, bio?: string) => {
  const passwordHash = await hashPassword('password');
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: passwordHash,
      profile: { create: { displayName, avatarUrl, bio } },
    },
  });
};

const ensureMembership = async (userId: string, tenantId: string, roles: string[] = []) => {
  let membership = await prisma.userTenantMembership.findFirst({
    where: { userId, tenantId }
  });
  
  if (!membership) {
    membership = await prisma.userTenantMembership.create({
      data: { userId, tenantId, status: 'APPROVED' }
    });
  }
  
  for (const role of roles) {
    const existingRole = await prisma.userTenantRole.findFirst({
      where: { membershipId: membership.id, role: role as any }
    });
    if (!existingRole) {
      await prisma.userTenantRole.create({
        data: { membershipId: membership.id, role: role as any, isPrimary: roles[0] === role }
      });
    }
  }
  
  return membership;
};

async function main() {
  console.log('🍩 Starting Springfield Community Church seed...');

  // 1. PLATFORM ADMIN
  const admin = await createUser(
    'admin@temple.com',
    'Platform Administrator',
    'https://api.dicebear.com/6.x/bottts/svg?seed=admin'
  );
  await prisma.user.update({
    where: { id: admin.id },
    data: { isSuperAdmin: true },
  });
  console.log('✅ Platform Administrator created');

  // 2. CREATE SPRINGFIELD COMMUNITY CHURCH TENANT (idempotent)
  const tenantSlug = 'springfield';
  const tenantData = {
    name: 'Springfield Community Church',
    slug: tenantSlug,
    description: 'A loving community church in the heart of Springfield, where everyone knows your name (and your sins).',
    creed: 'We believe in love, forgiveness, and potluck dinners.',
    street: '123 Evergreen Terrace',
    city: 'Springfield',
    state: 'OR',
    country: 'USA',
    postalCode: '97403',
    contactEmail: 'church@springfield.org',
    phoneNumber: '(555) PRAY-NOW',
    permissions: {
      ADMIN: { canCreatePosts: true, canCreateEvents: true, canManageFacilities: true, canManageResources: true },
      CLERGY: { canCreatePosts: true, canCreateEvents: true, canCreateSermons: true, canCreatePodcasts: true },
      STAFF: { canCreatePosts: true, canCreateEvents: true, canUploadResources: true, canManageFacilities: true },
      MEMBER: { canCreatePosts: true, canCreateGroupChats: true }
    },
  };

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: tenantData,
    create: tenantData,
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      logoUrl: 'https://api.dicebear.com/6.x/shapes/svg?seed=springfield-church',
      bannerImageUrl: 'https://placehold.co/1200x300/87CEEB/FFFFFF?text=Springfield+Community+Church',
      primaryColor: '#4A90E2',
      accentColor: '#FFD700',
      websiteUrl: 'https://springfield-church.org',
    },
    create: {
      tenantId: tenant.id,
      logoUrl: 'https://api.dicebear.com/6.x/shapes/svg?seed=springfield-church',
      bannerImageUrl: 'https://placehold.co/1200x300/87CEEB/FFFFFF?text=Springfield+Community+Church',
      primaryColor: '#4A90E2',
      accentColor: '#FFD700',
      websiteUrl: 'https://springfield-church.org',
    }
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {
      isPublic: true,
      membershipApprovalMode: 'APPROVAL_REQUIRED',
      enableCalendar: true,
      enablePosts: true,
      enableSermons: true,
      enablePodcasts: true,
      enableBooks: true,
      enableMemberDirectory: true,
      enableGroupChat: true,
      enableComments: true,
      enableReactions: true,
      enablePhotos: true,
      enableLiveStream: true,
      enableServices: true,
      enableEvents: true,
      donationSettings: {},
      liveStreamSettings: {},
      visitorVisibility: { posts: true, calendar: true, sermons: true }
    },
    create: {
      tenantId: tenant.id,
      isPublic: true,
      membershipApprovalMode: 'APPROVAL_REQUIRED',
      enableCalendar: true,
      enablePosts: true,
      enableSermons: true,
      enablePodcasts: true,
      enableBooks: true,
      enableMemberDirectory: true,
      enableGroupChat: true,
      enableComments: true,
      enableReactions: true,
      enablePhotos: true,
      enableLiveStream: true,
      enableServices: true,
      enableEvents: true,
      donationSettings: {},
      liveStreamSettings: {},
      visitorVisibility: { posts: true, calendar: true, sermons: true }
    }
  });

  console.log('✅ Springfield Community Church tenant created');

  // 3. CREATE 20 SIMPSONS CHARACTERS
  const characters = [
    { email: 'reverend@springfield.org', name: 'Reverend Timothy Lovejoy', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=lovejoy&backgroundColor=b6e3f4', bio: 'Shepherd of Springfield Community Church. "Have you tried simply turning off the TV, sitting down with your children, and hitting them?"', roles: ['CLERGY', 'ADMIN'] },
    { email: 'ned@springfield.org', name: 'Ned Flanders', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=ned&backgroundColor=c0aede', bio: 'Okily-dokily! Staff coordinator and everyone\'s favorite neighbor. "I\'ve done everything the Bible says - even the stuff that contradicts the other stuff!"', roles: ['STAFF'] },
    { email: 'homer@springfield.org', name: 'Homer Simpson', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=homer&backgroundColor=ffd5dc', bio: 'Safety inspector at the nuclear plant. Donut enthusiast. "I\'m normally not a praying man, but if you\'re up there, please save me Superman!"', roles: ['MEMBER'] },
    { email: 'marge@springfield.org', name: 'Marge Simpson', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=marge&backgroundColor=ffdfbf', bio: 'Devoted mother and wife. Blue hair, big heart. Organizer extraordinaire.', roles: ['MEMBER'] },
    { email: 'bart@springfield.org', name: 'Bart Simpson', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=bart&backgroundColor=a5a5f5', bio: 'Underachiever and proud of it! Youth group troublemaker. "Eat my shorts!"', roles: ['MEMBER'] },
    { email: 'lisa@springfield.org', name: 'Lisa Simpson', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=lisa&backgroundColor=d0e8f2', bio: 'Aspiring jazz musician and voice of reason. Actually reads the Bible study materials.', roles: ['MEMBER'] },
    { email: 'maude@springfield.org', name: 'Maude Flanders', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=maude&backgroundColor=ffb7ce', bio: 'Sweet soul in heaven now, but her presence lives on. Prayer chain coordinator.', roles: ['MEMBER'] },
    { email: 'helen@springfield.org', name: 'Helen Lovejoy', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=helen&backgroundColor=e8d5c4', bio: 'First lady of Springfield Community Church. "Won\'t somebody PLEASE think of the children?!"', roles: ['MEMBER'] },
    { email: 'moe@springfield.org', name: 'Moe Szyslak', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=moe&backgroundColor=d5d5d5', bio: 'Tavern owner seeking redemption. Surprisingly regular church attender.', roles: ['MEMBER'] },
    { email: 'apu@springfield.org', name: 'Apu Nahasapeemapetilon', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=apu&backgroundColor=fff4e6', bio: 'Kwik-E-Mart proprietor. "Thank you, come again!" Interfaith dialogue enthusiast.', roles: ['MEMBER'] },
    { email: 'chief@springfield.org', name: 'Chief Wiggum', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=wiggum&backgroundColor=e3f2fd', bio: 'Police chief. Donut lover. Church security volunteer.', roles: ['MEMBER'] },
    { email: 'skinner@springfield.org', name: 'Principal Skinner', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=skinner&backgroundColor=f3e5f5', bio: 'School principal and Vietnam vet. Follows rules and church bulletins meticulously.', roles: ['MODERATOR'] },
    { email: 'burns@springfield.org', name: 'Mr. Burns', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=burns&backgroundColor=e0e0e0', bio: 'Nuclear plant owner. Attends for tax deduction purposes. "Excellent."', roles: ['MEMBER'] },
    { email: 'smithers@springfield.org', name: 'Waylon Smithers', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=smithers&backgroundColor=fff9c4', bio: 'Faithful assistant. Choir member with excellent pitch.', roles: ['MEMBER'] },
    { email: 'barney@springfield.org', name: 'Barney Gumble', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=barney&backgroundColor=dcedc8', bio: 'Working the 12 steps, one Sunday at a time. *burp*', roles: ['MEMBER'] },
    { email: 'lenny@springfield.org', name: 'Lenny Leonard', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=lenny&backgroundColor=b2dfdb', bio: 'Nuclear plant worker. Carl\'s best friend. Ushers on Sundays.', roles: ['MEMBER'] },
    { email: 'carl@springfield.org', name: 'Carl Carlson', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=carl&backgroundColor=b2ebf2', bio: 'Nuclear plant worker. Lenny\'s best friend. Brings the coffee to meetings.', roles: ['MEMBER'] },
    { email: 'krusty@springfield.org', name: 'Krusty the Clown', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=krusty&backgroundColor=ffccbc', bio: 'Comedian seeking redemption after tax scandal. "Hey hey!"', roles: ['MEMBER'] },
    { email: 'milhouse@springfield.org', name: 'Milhouse Van Houten', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=milhouse&backgroundColor=f8bbd0', bio: 'Bart\'s best friend. Glasses-wearing youth group member. "Everything\'s coming up Milhouse!"', roles: ['MEMBER'] },
    { email: 'willie@springfield.org', name: 'Groundskeeper Willie', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=willie&backgroundColor=c5e1a5', bio: 'Church groundskeeper. Scottish and proud. "Grease me up, woman!"', roles: ['MEMBER'] },
  ];

  const users: any[] = [];
  for (const char of characters) {
    const user = await createUser(char.email, char.name, char.avatar, char.bio);
    await ensureMembership(user.id, tenant.id, char.roles);
    users.push({ ...user, roles: char.roles });
  }

  console.log(`✅ Created ${users.length} Springfield residents`);

  // 4. CREATE GLOBAL DM CONVERSATIONS (sampling interesting pairs)
  const dmPairs = [
    [0, 1], // Lovejoy & Ned
    [2, 3], // Homer & Marge
    [4, 18], // Bart & Milhouse
    [5, 6], // Lisa & Maude
    [8, 14], // Moe & Barney
    [15, 16], // Lenny & Carl
    [11, 4], // Skinner & Bart
    [1, 7], // Ned & Helen
  ];

  for (const [i, j] of dmPairs) {
    const convo = await prisma.conversation.create({
      data: {
        scope: 'GLOBAL',
        kind: 'DM',
        participants: {
          create: [
            { userId: users[i].id },
            { userId: users[j].id }
          ]
        }
      }
    });

    // Add some messages
    const messages = [
      { from: i, text: `Hey ${characters[j].name.split(' ')[0]}! How are you?` },
      { from: j, text: `Good to hear from you! Just finished reading the church bulletin.` },
      { from: i, text: `Great! Looking forward to Sunday service.` },
    ];

    for (const msg of messages) {
      await prisma.chatMessage.create({
        data: {
          conversationId: convo.id,
          userId: users[msg.from].id,
          text: msg.text
        }
      });
    }
  }

  console.log(`✅ Created ${dmPairs.length} DM conversations`);

  // 5. CREATE TENANT CHAT ROOMS
  const chatRooms = [
    { name: 'General Fellowship', messages: [
      { from: 0, text: 'Welcome everyone to our church chat! May the Lord bless your day.' },
      { from: 1, text: 'Okily-dokily! Great to be here with all you wonderful people!' },
      { from: 2, text: 'Mmm... is there a chat room for donuts?' },
      { from: 3, text: 'Homer! This is for fellowship, not food.' },
      { from: 5, text: 'I think this is a wonderful way to stay connected as a community.' },
    ]},
    { name: 'Prayer Requests', messages: [
      { from: 1, text: 'Please pray for my Leftorium - sales have been slow.' },
      { from: 7, text: 'Praying for you, Ned! And won\'t somebody think of the children\'s Sunday school fundraiser?' },
      { from: 14, text: '*burp* Pray for my sobriety journey, friends.' },
      { from: 0, text: 'All wonderful intentions. Let us lift each other up in prayer.' },
    ]},
    { name: 'Youth Group', messages: [
      { from: 4, text: 'Cowabunga! Youth group was epic last week!' },
      { from: 18, text: 'Yeah! Can we do the pizza party again?' },
      { from: 5, text: 'I prefer the Bible study portion, personally.' },
      { from: 11, text: 'Bart Simpson! I better not catch you putting whoopee cushions on the pews again!' },
    ]},
    { name: 'Volunteer Coordination', messages: [
      { from: 1, text: 'Who can help with the church cleanup this Saturday?' },
      { from: 19, text: 'Aye! I\'ll bring me tools and elbow grease!' },
      { from: 3, text: 'I can bring refreshments for the volunteers.' },
      { from: 15, text: 'Carl and I are in!' },
      { from: 16, text: 'Yep, Lenny and I make a good team.' },
    ]},
  ];

  for (const room of chatRooms) {
    const convo = await prisma.conversation.create({
      data: {
        tenantId: tenant.id,
        scope: 'TENANT',
        kind: 'CHANNEL',
        name: room.name,
        participants: {
          create: users.map(u => ({ userId: u.id }))
        }
      }
    });

    for (const msg of room.messages) {
      await prisma.chatMessage.create({
        data: {
          conversationId: convo.id,
          userId: users[msg.from].id,
          text: msg.text
        }
      });
    }
  }

  console.log(`✅ Created ${chatRooms.length} tenant chat rooms`);

  // 6. CREATE POSTS
  const posts = [
    { author: 0, title: 'Sunday Service Reminder', content: 'Join us this Sunday at 10 AM for a message about forgiveness and redemption. Coffee and donuts after!' },
    { author: 1, title: 'Volunteer Opportunity', content: 'Hi-diddly-ho! We need volunteers for the church picnic. Sign up in the fellowship hall!' },
    { author: 3, title: 'Bake Sale Success!', content: 'Thank you everyone who contributed to our bake sale. We raised $500 for the youth mission trip!' },
    { author: 5, title: 'Book Club Meeting', content: 'Our next book club will discuss "The Good Book" - literally, we\'re reading Psalms. Everyone welcome!' },
  ];

  for (const post of posts) {
    await prisma.post.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[post.author].id,
        type: 'ANNOUNCEMENT',
        title: post.title,
        body: post.content,
        isPublished: true,
      }
    });
  }

  console.log(`✅ Created ${posts.length} posts`);

  // 7. CREATE EVENTS
  const events = [
    { creator: 0, title: 'Sunday Worship Service', description: 'Weekly worship service with music, message, and fellowship.', date: new Date('2025-12-07T10:00:00'), location: 'Main Sanctuary' },
    { creator: 1, title: 'Wednesday Night Bible Study', description: 'Join us for an in-depth study of Romans. Ned-approved snacks provided!', date: new Date('2025-12-10T19:00:00'), location: 'Fellowship Hall' },
    { creator: 3, title: 'Church Picnic', description: 'Annual church picnic with games, food, and fun for the whole family!', date: new Date('2025-12-14T12:00:00'), location: 'Springfield Park' },
    { creator: 5, title: 'Youth Group Game Night', description: 'Board games, video games, and faith-based discussions. Pizza included!', date: new Date('2025-12-13T18:00:00'), location: 'Youth Room' },
  ];

  for (const evt of events) {
    await prisma.event.create({
      data: {
        tenantId: tenant.id,
        createdByUserId: users[evt.creator].id,
        title: evt.title,
        description: evt.description,
        startDateTime: evt.date,
        endDateTime: new Date(evt.date.getTime() + 2 * 60 * 60 * 1000),
        locationText: evt.location,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      }
    });
  }

  console.log(`✅ Created ${events.length} events`);

  // Suggested Livestream event (online)
  const livestream = await prisma.event.create({
    data: {
      tenantId: tenant.id,
      createdByUserId: users[0].id,
      title: 'Livestream: Sunday Worship (Suggested)',
      description: 'Join our suggested livestream for Sunday worship. This is a seeded example of an online service.',
      startDateTime: new Date('2025-12-07T10:00:00'),
      endDateTime: new Date('2025-12-07T11:30:00'),
      isOnline: true,
      onlineUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
    }
  });

  console.log('✅ Created livestream suggestion event');

  // 8. CREATE SERMONS (YouTube links) + PHOTOS (images)
  const sermons = [
    { uploader: 0, title: 'Message: Redemption & Grace', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'A short message on grace and redemption.' },
    { uploader: 1, title: 'Message: Community & Service', url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE', description: 'Encouraging service and community.' },
  ];

  for (const s of sermons) {
    await prisma.mediaItem.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[s.uploader].id,
        type: 'SERMON_VIDEO',
        title: s.title,
        description: s.description,
        embedUrl: s.url,
      }
    });
  }

  const photos = [
    { uploader: 1, title: 'Church Picnic 2024', url: 'https://picsum.photos/seed/picnic/1200/800', caption: 'What a blessed day with wonderful people!' },
    { uploader: 3, title: 'Youth Group Fun', url: 'https://picsum.photos/seed/youth/1200/800', caption: 'Our amazing youth having a great time!' },
    { uploader: 5, title: 'Choir Night', url: 'https://picsum.photos/seed/choir/1200/800', caption: 'Lifting our voices together.' },
  ];

  for (const photo of photos) {
    await prisma.mediaItem.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[photo.uploader].id,
        title: photo.title,
        description: photo.caption,
        embedUrl: photo.url,
        type: 'IMAGE',
      }
    });
  }

  console.log(`✅ Created ${sermons.length} sermons and ${photos.length} photos`);

  // 9. CREATE PODCASTS
  const podcasts = [
    { creator: 0, title: 'Sermons from Springfield', description: 'Weekly messages from Reverend Lovejoy', url: 'https://example.com/podcast/sermons.mp3', duration: 1800 },
    { creator: 1, title: 'Ned\'s Neighborly Wisdom', description: 'Faith tips for everyday living, diddly-style!', url: 'https://example.com/podcast/ned.mp3', duration: 1200 },
    { creator: 0, title: 'Gal of Constant Sorrow (Test)', description: 'Test podcast episode added from Apple Podcasts link', url: 'https://podcasts.apple.com/us/podcast/594-gal-of-constant-sorrow/id893008561?i=1000733611121', duration: 300 },
  ];

  for (const podcast of podcasts) {
    await prisma.podcast.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[podcast.creator].id,
        title: podcast.title,
        description: podcast.description,
        audioUrl: podcast.url,
        duration: podcast.duration,
        isPublished: true,
      }
    });
  }

  console.log(`✅ Created ${podcasts.length} podcasts`);

  // 10. CREATE BOOKS/RESOURCES
  const books = [
    { creator: 0, title: 'The Springfield Study Bible', description: 'A comprehensive guide for our community', fileUrl: 'https://example.com/books/study-bible.pdf' },
    { creator: 5, title: 'Youth Devotional Guide', description: 'Daily devotions for young believers', fileUrl: 'https://example.com/books/youth-devotional.pdf' },
    { creator: 1, title: 'Practical Faith in Community', description: 'Building faith through service and fellowship', fileUrl: 'https://example.com/books/practical-faith.pdf' },
    { creator: 3, title: 'Songs of Springfield', description: 'A collection of worship songs used in our services', fileUrl: 'https://example.com/books/songs-of-springfield.pdf' },
  ];

  for (const book of books) {
    await prisma.book.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[book.creator].id,
        title: book.title,
        authorName: 'Springfield Authors',
        description: book.description,
        pdfUrl: book.fileUrl,
        isPublished: true,
      }
    });
  }

  // Also create corresponding Post entries so the Books page (which reads posts of type 'BOOK') shows seeded books
  for (const book of books) {
    try {
      await prisma.post.create({
        data: {
          tenantId: tenant.id,
          authorUserId: users[book.creator].id,
          type: 'BOOK',
          title: book.title,
          body: `${book.description}\n\nDownload: ${book.fileUrl}`,
          isPublished: true,
        }
      });
    } catch (e) {
      // ignore errors if posts already exist
    }
  }

  console.log(`✅ Created ${books.length} books`);

  // 11. CREATE FACILITIES
  const facilities = [
    { name: 'Main Sanctuary', description: 'Our beautiful main worship space with seating for 200', type: 'HALL' as const, capacity: 200 },
    { name: 'Fellowship Hall', description: 'Perfect for events, meals, and gatherings', type: 'HALL' as const, capacity: 100 },
  ];

  for (const facility of facilities) {
    await prisma.facility.create({
      data: {
        tenantId: tenant.id,
        name: facility.name,
        description: facility.description,
        type: facility.type,
        capacity: facility.capacity,
        isActive: true,
      }
    });
  }

  console.log(`✅ Created ${facilities.length} facilities`);

  // 12. CREATE SMALL GROUPS
  const smallGroups = [
    { leader: 1, name: 'Men\'s Bible Study', description: 'For the gentlemen of Springfield to study scripture and support each other', status: 'OPEN' as const },
    { leader: 3, name: 'Women\'s Fellowship', description: 'A place for ladies to connect, pray, and share life together', status: 'OPEN' as const },
  ];

  for (const group of smallGroups) {
    await prisma.smallGroup.create({
      data: {
        tenantId: tenant.id,
        name: group.name,
        description: group.description,
        leaderUserId: users[group.leader].id,
        status: group.status,
        joinPolicy: 'OPEN',
      }
    });
  }

  console.log(`✅ Created ${smallGroups.length} small groups`);

  // 13. CREATE RESOURCE ITEMS
  const resources = [
    { uploader: 0, title: 'Church Bylaws', description: 'Official church governance documents', fileUrl: 'https://example.com/resources/bylaws.pdf', visibility: 'MEMBERS_ONLY' as const },
    { uploader: 1, title: 'Volunteer Handbook', description: 'Guide for all church volunteers', fileUrl: 'https://example.com/resources/volunteer.pdf', visibility: 'PUBLIC' as const },
  ];

  for (const resource of resources) {
    await prisma.resourceItem.create({
      data: {
        tenantId: tenant.id,
        uploaderUserId: users[resource.uploader].id,
        title: resource.title,
        description: resource.description,
        fileUrl: resource.fileUrl,
        fileType: 'PDF',
        visibility: resource.visibility,
      }
    });
  }

  console.log(`✅ Created ${resources.length} resource items`);

  // 14. CREATE COMMUNITY POSTS (Prayer/Needs)
  const communityPosts = [
    { author: 14, type: 'PRAYER_REQUEST' as const, title: 'Prayer for Sobriety', content: 'Please pray for my continued journey in recovery. One day at a time.', status: 'PUBLISHED' as const },
    { author: 8, type: 'TANGIBLE_NEED' as const, title: 'Need: Food Donations', content: 'The church food pantry is running low. Any donations appreciated!', status: 'PUBLISHED' as const },
  ];

  for (const cpost of communityPosts) {
    await prisma.communityPost.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[cpost.author].id,
        type: cpost.type,
        body: cpost.content,
        isAnonymous: false,
        status: cpost.status,
      }
    });
  }

  console.log(`✅ Created ${communityPosts.length} community posts`);

  // 15. CREATE CONTACT SUBMISSIONS
  const contactSubmissions = [
    { name: 'Otto Mann', email: 'otto@springfield.org', message: 'Hey dudes! I drive the school bus and want to check out your church. When are services?', status: 'UNREAD' as const },
    { name: 'Comic Book Guy', email: 'comicbookguy@springfield.org', message: 'Worst. Theological interpretation. Ever. Just kidding, but I do have some questions...', status: 'READ' as const },
  ];

  for (const contact of contactSubmissions) {
    await prisma.contactSubmission.create({
      data: {
        tenantId: tenant.id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        status: contact.status,
      }
    });
  }

  console.log(`✅ Created ${contactSubmissions.length} contact submissions`);

  // 16. CREATE TRIPS
  const trips = [
    { 
      leader: 1, 
      title: 'Mission Trip to Shelbyville', 
      description: 'Help our neighbors in Shelbyville rebuild their community center. Despite our rivalry, we\'re all God\'s children!',
      destination: 'Shelbyville, USA',
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-06-22'),
      status: 'PUBLISHED' as const,
      maxParticipants: 20,
      cost: 500
    },
    { 
      leader: 0, 
      title: 'Pilgrimage to Capital City Cathedral', 
      description: 'A spiritual journey to visit the historic cathedral and deepen our faith.',
      destination: 'Capital City, USA',
      startDate: new Date('2025-08-10'),
      endDate: new Date('2025-08-12'),
      status: 'PLANNING' as const,
      maxParticipants: 15,
      cost: 300
    },
  ];

  for (const trip of trips) {
    await prisma.trip.create({
      data: {
        tenantId: tenant.id,
        leaderUserId: users[trip.leader].id,
        createdByUserId: users[trip.leader].id,
        name: trip.title,
        description: trip.description,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        capacity: trip.maxParticipants,
        costCents: trip.cost * 100,
      }
    });
  }

  console.log(`✅ Created ${trips.length} mission trips`);

  // 17. CREATE FUNDS
  const generalFund = await prisma.fund.create({
    data: {
      tenantId: tenant.id,
      name: 'General Tithes',
      description: 'Support the daily ministry needs of the community.',
      type: 'TITHE',
      visibility: 'PUBLIC',
      currency: 'USD',
      goalAmountCents: 500000,
      allowAnonymous: true,
    }
  });

  console.log('✅ Created default general fund');

  // 17. CREATE DONATIONS
  const donations = [
    { donor: 12, amount: 10000, displayName: 'Mr. Burns', note: 'From the nuclear plant. Tax deductible, of course.' },
    { donor: 2, amount: 50, displayName: 'Homer Simpson', note: 'For the coffee hour donuts. Very important.' },
  ];

  for (const donation of donations) {
    await prisma.donationRecord.create({
      data: {
        tenantId: tenant.id,
        fundId: generalFund.id,
        userId: users[donation.donor].id,
        displayName: donation.displayName,
        amount: donation.amount,
        currency: 'USD',
        message: donation.note,
        donatedAt: new Date(),
      }
    });
  }

  console.log(`✅ Created ${donations.length} donations`);

  // 18. CREATE VOLUNTEER NEEDS
  const volunteerNeeds = [
    { creator: 1, title: 'Church Cleanup Day', description: 'Help us spring clean the church grounds!', date: new Date('2025-12-15T09:00:00'), location: 'Church Grounds', spotsNeeded: 10 },
    { creator: 3, title: 'Nursery Volunteers', description: 'We need loving volunteers for Sunday morning childcare.', date: new Date('2025-12-07T09:30:00'), location: 'Nursery Room', spotsNeeded: 3 },
  ];

  for (const need of volunteerNeeds) {
    await prisma.volunteerNeed.create({
      data: {
        tenantId: tenant.id,
        title: need.title,
        description: need.description,
        date: need.date,
        location: need.location,
        slotsNeeded: need.spotsNeeded,
      }
    });
  }

  console.log(`✅ Created ${volunteerNeeds.length} volunteer needs`);

  // 19. CREATE PROFILE POSTS
  const profilePosts = [
    { author: 2, content: 'Woo-hoo! Just got baptized! ...Wait, is that the right reaction?' },
    { author: 4, content: 'Youth group was cool. Didn\'t get caught putting gum under the chairs. Success!' },
  ];

  for (const ppost of profilePosts) {
    await prisma.profilePost.create({
      data: {
        userId: users[ppost.author].id,
        type: 'TEXT',
        content: ppost.content,
      }
    });
  }

  console.log(`✅ Created ${profilePosts.length} profile posts`);

  // 20. CREATE SERVICE OFFERINGS
  const serviceOfferings = [
    { name: 'Wedding Ceremonies', description: 'Beautiful wedding services performed by Reverend Lovejoy', category: 'CEREMONY' as const, pricing: '$500-1000', isPublic: true },
    { name: 'Pastoral Counseling', description: 'One-on-one guidance and support', category: 'COUNSELING' as const, pricing: 'Free for members', isPublic: true },
  ];

  for (const service of serviceOfferings) {
    await prisma.serviceOffering.create({
      data: {
        tenantId: tenant.id,
        name: service.name,
        description: service.description,
        category: service.category,
        pricing: service.pricing,
        isPublic: service.isPublic,
      }
    });
  }

  console.log(`✅ Created ${serviceOfferings.length} service offerings`);

  console.log('\n🍩 Springfield Community Church is ready!');
  console.log('📧 Login as admin@temple.com or any character email (password: password)');
  console.log('🏛️  Tenant: /springfield');
  console.log(`👥 ${users.length} members ready to fellowship!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

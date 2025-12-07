import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper functions
const hashPassword = async (password: string) => bcrypt.hash(password, 10);

const createUser = async (email: string, displayName: string, avatarUrl: string, bio?: string) => {
  const passwordHash = await hashPassword('T3mple.com');
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
      LEADER: { canCreatePosts: true, canCreateEvents: true, canCreateTalks: true, canCreatePodcasts: true },
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
      enableTalks: true,
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
      enableDonations: true,
      enableTrips: true,
      enableVolunteering: true,
      enableSmallGroups: true,
      enableResourceCenter: true,
      enableSupportRequests: true,
      enableMemorials: true,
      enableAssetManagement: true,
      enableWorkboard: true,
      enableTicketing: true,
      enablePrayerWall: true,
      enableBirthdays: true,
      donationSettings: {},
      liveStreamSettings: { isLive: true, embedUrl: 'https://www.youtube.com/embed/QYO-tNjkQO8', title: 'LabPadre 24/7 Starbase Livestream' },
      visitorVisibility: { posts: true, calendar: true, talks: true }
    },
    create: {
      tenantId: tenant.id,
      isPublic: true,
      membershipApprovalMode: 'APPROVAL_REQUIRED',
      enableCalendar: true,
      enablePosts: true,
      enableTalks: true,
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
      enableDonations: true,
      enableTrips: true,
      enableVolunteering: true,
      enableSmallGroups: true,
      enableResourceCenter: true,
      enableSupportRequests: true,
      enableMemorials: true,
      enableAssetManagement: true,
      enableWorkboard: true,
      enableTicketing: true,
      enablePrayerWall: true,
      enableBirthdays: true,
      donationSettings: {},
      liveStreamSettings: { isLive: true, embedUrl: 'https://www.youtube.com/embed/QYO-tNjkQO8', title: 'LabPadre 24/7 Starbase Livestream' },
      visitorVisibility: { posts: true, calendar: true, talks: true }
    }
  });

  console.log('✅ Springfield Community Church tenant created');

  // Add Platform Admin as a member of Springfield tenant with ADMIN role
  await ensureMembership(admin.id, tenant.id, ['ADMIN']);

  // 3. CREATE 20 SIMPSONS CHARACTERS
  const characters = [
    { email: 'reverend@springfield.org', name: 'Reverend Timothy Lovejoy', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=lovejoy&backgroundColor=b6e3f4', bio: 'Shepherd of Springfield Community Church. "Have you tried simply turning off the TV, sitting down with your children, and hitting them?"', roles: ['LEADER', 'ADMIN'] },
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
    { pair: [0, 1], messages: [ // Lovejoy & Ned
      { from: 0, text: 'Ned, I need to talk to you about the upcoming sermon...' },
      { from: 1, text: 'Of course, Reverend! I\'m all ears-diddly-ears!' },
      { from: 0, text: 'Can you... tone down the "diddlys" during the announcements?' },
      { from: 1, text: 'Oh my, have I been overdoing it? Gosh-darn-diddly-doodly!' },
      { from: 0, text: '*sigh* Never mind, Ned. You\'re fine.' },
    ]},
    { pair: [2, 3], messages: [ // Homer & Marge
      { from: 2, text: 'Marge! Did you pack my snacks for church?' },
      { from: 3, text: 'Homer, it\'s only a one hour service!' },
      { from: 2, text: 'But what if they do communion and I\'m still hungry?' },
      { from: 3, text: 'That\'s not how communion works, Homie.' },
      { from: 2, text: 'Mmm... communion bread... *drool*' },
    ]},
    { pair: [4, 18], messages: [ // Bart & Milhouse
      { from: 4, text: 'Dude, did you see Skinner at church? He was watching me like a hawk!' },
      { from: 18, text: 'Maybe because of the whoopee cushion incident?' },
      { from: 4, text: 'That was a classic, man. Lovejoy jumped three feet!' },
      { from: 18, text: 'My mom grounded me for laughing. But it was worth it!' },
      { from: 4, text: 'Everything\'s coming up Milhouse! Well, except the grounding part.' },
    ]},
    { pair: [5, 6], messages: [ // Lisa & Maude (spiritual)
      { from: 5, text: 'Mrs. Flanders, do you think jazz can be spiritual?' },
      { from: 6, text: 'Oh Lisa, all beautiful music is a gift from above!' },
      { from: 5, text: 'I want to play saxophone at the next service. Do you think they\'d let me?' },
      { from: 6, text: 'I think it would be lovely! I\'ll talk to the Reverend.' },
    ]},
    { pair: [8, 14], messages: [ // Moe & Barney (recovery)
      { from: 8, text: 'Hey Barn, how\'s the recovery going?' },
      { from: 14, text: '*burp* Three weeks sober! The church group really helps.' },
      { from: 8, text: 'Proud of ya, buddy. I know it ain\'t easy.' },
      { from: 14, text: 'Thanks Moe. Means a lot coming from... well, a bartender.' },
      { from: 8, text: 'Hey, I support your journey. Even if it\'s bad for business.' },
    ]},
    { pair: [15, 16], messages: [ // Lenny & Carl
      { from: 15, text: 'Carl, you bringing the coffee again this Sunday?' },
      { from: 16, text: 'You know it! Got that new Ethiopian blend.' },
      { from: 15, text: 'Nice! Church coffee is the best part. Don\'t tell Homer I said that.' },
      { from: 16, text: 'Our secret. Though he probably just comes for the donuts anyway.' },
    ]},
    { pair: [11, 4], messages: [ // Skinner & Bart
      { from: 11, text: 'Simpson! I know you\'re planning something for Sunday.' },
      { from: 4, text: 'I don\'t know what you\'re talking about, Principal Skinner.' },
      { from: 11, text: 'I have my eyes on you. Even in the house of the Lord.' },
      { from: 4, text: 'That sounds kind of creepy, man.' },
      { from: 11, text: 'That\'s... fair. But behave yourself!' },
    ]},
    { pair: [1, 7], messages: [ // Ned & Helen
      { from: 1, text: 'Helen, thank you for organizing the bake sale!' },
      { from: 7, text: 'Oh Ned, it\'s my pleasure! Anything for the church.' },
      { from: 1, text: 'Your lemon bars were a hit!' },
      { from: 7, text: 'Well, someone has to set a good example. Unlike SOME people...' },
      { from: 1, text: 'Now Helen, let\'s not gossip. That\'s not very Christian-diddly-istian.' },
    ]},
  ];

  for (const { pair, messages } of dmPairs) {
    const [i, j] = pair;
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
    { name: 'Choir & Music', messages: [
      { from: 13, text: 'I\'ve been practicing my solo for Sunday. Mr. Burns said I have excellent pitch.' },
      { from: 5, text: 'Can we add some jazz elements to the hymns? I could bring my saxophone!' },
      { from: 0, text: 'Lisa, that\'s... actually not a bad idea. Let\'s discuss after rehearsal.' },
      { from: 3, text: 'Homer, please stop singing in the shower voice during practice.' },
      { from: 2, text: 'But Marge, that\'s my best voice! Woo-hoo!' },
      { from: 7, text: 'Won\'t somebody think of the congregation\'s ears?!' },
    ]},
    { name: 'Donut Fellowship', messages: [
      { from: 2, text: 'Mmm... donuts. Who\'s bringing them this Sunday?' },
      { from: 10, text: 'I can pick some up from the Kwik-E-Mart. Uh, for professional reasons.' },
      { from: 9, text: 'Thank you, come again! I will provide the finest donuts in Springfield!' },
      { from: 2, text: 'Apu, you\'re my hero. D\'oh-nuts forever!' },
      { from: 1, text: 'Now Homer, remember - share with everyone, neighborino!' },
      { from: 2, text: 'Okily-dokily, Ned. ...Maybe.' },
      { from: 12, text: 'I shall donate the funds for premium donuts. Excellent.' },
    ]},
    { name: 'Parents & Families', messages: [
      { from: 3, text: 'Any tips for getting kids ready for church on time?' },
      { from: 7, text: 'Won\'t somebody think of the children and their tardiness?!' },
      { from: 1, text: 'We wake up at 5 AM for family devotions! Works like a charm!' },
      { from: 2, text: 'Five AM?! That\'s still night time!' },
      { from: 11, text: 'As a principal, I recommend a strict schedule. Perhaps detention for lateness?' },
      { from: 4, text: 'Detention at church? Ay caramba!' },
      { from: 3, text: 'Bart, you\'re supposed to be in the Youth Group chat...' },
    ]},
    { name: 'Book & Bible Study', messages: [
      { from: 5, text: 'This week we\'re studying Ecclesiastes. "There is nothing new under the sun."' },
      { from: 0, text: 'Excellent choice, Lisa. Very... ecclesiastical.' },
      { from: 1, text: 'I\'ve prepared a 47-page study guide! Hi-diddly-ho!' },
      { from: 2, text: 'Forty-seven pages?! Is there a movie version?' },
      { from: 8, text: 'I actually read some of the Bible last week. Pretty good stuff once you get into it.' },
      { from: 14, text: '*burp* ...Sorry. The wisdom literature really speaks to me.' },
    ]},
    { name: 'Outreach & Missions', messages: [
      { from: 0, text: 'We\'re planning our annual mission trip to Shelbyville. Who\'s interested?' },
      { from: 1, text: 'Despite our rivalry, we must love our neighbors. Even Shelbyville-ians!' },
      { from: 17, text: 'Hey hey! I can do a show for the kids there!' },
      { from: 5, text: 'I\'d love to help with the literacy program.' },
      { from: 19, text: 'I\'ll fix whatever needs fixin\'! These hands were made for workin\'!' },
      { from: 3, text: 'I can organize the food distribution. My casseroles are famous!' },
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
          create: [
            // Add all Simpsons characters
            ...users.map(u => ({ userId: u.id })),
            // Also add the Platform Admin so they can see channels
            { userId: admin.id }
          ]
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

  // 8. CREATE TALKS (YouTube links) + PHOTOS (images)
  const talks = [
    { uploader: 0, title: 'Message: Redemption & Grace', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'A short message on grace and redemption.' },
    { uploader: 1, title: 'Message: Community & Service', url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE', description: 'Encouraging service and community.' },
  ];

  for (const s of talks) {
    await prisma.mediaItem.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[s.uploader].id,
        type: 'TALK_VIDEO',
        title: s.title,
        description: s.description,
        embedUrl: s.url,
      }
    });
  }

  const photos = [
    { uploader: 1, title: 'Church Picnic 2024', url: 'https://images.unsplash.com/photo-1529543544277-750e7dce8c71?w=1200', caption: 'What a blessed day with wonderful people! Ned brought his famous seven-layer dip.' },
    { uploader: 3, title: 'Youth Group Fun', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200', caption: 'Our amazing youth having a great time! Bart only broke one window this time.' },
    { uploader: 5, title: 'Choir Night', url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1200', caption: 'Lifting our voices together. Lisa nailed that saxophone solo!' },
    { uploader: 0, title: 'Sunday Service', url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200', caption: 'Another beautiful Sunday morning. Homer managed to stay awake for 45 minutes!' },
    { uploader: 3, title: 'Bake Sale Success', url: 'https://images.unsplash.com/photo-1486427944544-d2c6e56c5e12?w=1200', caption: 'Marge\'s famous desserts sold out in an hour! D\'oh, Homer ate half of them.' },
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

  console.log(`✅ Created ${talks.length} talks and ${photos.length} photos`);

  // 9. CREATE PODCASTS
  const podcasts = [
    { creator: 0, title: 'Talks from Springfield', description: 'Weekly messages from Reverend Lovejoy', url: 'https://example.com/podcast/talks.mp3', duration: 1800 },
    { creator: 1, title: 'Ned\'s Neighborly Wisdom', description: 'Faith tips for everyday living, diddly-style!', url: 'https://example.com/podcast/ned.mp3', duration: 1200 },
    { creator: 0, title: 'Gal of Constant Sorrow (Test)', description: 'Test podcast episode added from Apple Podcasts link', url: 'https://podcasts.apple.com/us/podcast/594-gal-of-constant-sorrow/id893008561?i=1000733611121', duration: 300 },
    { creator: 0, title: 'Fland Canyon', description: 'Seeded podcast: Fland Canyon (Apple Podcasts)', url: 'https://podcasts.apple.com/us/podcast/599-fland-canyon/id893008561?i=1000739054618', duration: 1200 },
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

  // Ensure media item for Fland Canyon exists so the Podcasts page (which reads MediaItem type PODCAST_AUDIO) shows it
  const flandEmbed = 'https://podcasts.apple.com/us/podcast/599-fland-canyon/id893008561?i=1000739054618';
  const existingFland = await prisma.mediaItem.findFirst({ where: { tenantId: tenant.id, embedUrl: flandEmbed } });
  if (!existingFland) {
    await prisma.mediaItem.create({
      data: {
        tenantId: tenant.id,
        authorUserId: users[0].id,
        type: 'PODCAST_AUDIO',
        title: 'Fland Canyon',
        description: 'Seeded podcast: Fland Canyon (Apple Podcasts)',
        embedUrl: flandEmbed,
      }
    });
    console.log('✅ Created media item for Fland Canyon (PODCAST_AUDIO)');
  }

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

  // 11. CREATE FACILITIES (with duplicate check)
  const facilities = [
    { name: 'Main Sanctuary', description: 'Our beautiful main worship space with seating for 200. Homer once fell asleep here for 3 hours.', type: 'HALL' as const, capacity: 200 },
    { name: 'Fellowship Hall', description: 'Perfect for events, meals, and gatherings. The coffee is always fresh (thanks Marge!)', type: 'HALL' as const, capacity: 100 },
    { name: 'Youth Room', description: 'Where the magic happens! Bart has drawn on every chair at least once.', type: 'ROOM' as const, capacity: 30 },
    { name: 'Prayer Chapel', description: 'A quiet space for reflection. No cell phones, no Krusty the Clown impressions.', type: 'ROOM' as const, capacity: 10 },
  ];

  for (const facility of facilities) {
    const existing = await prisma.facility.findFirst({
      where: { tenantId: tenant.id, name: facility.name }
    });
    if (!existing) {
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
    { author: 14, type: 'SUPPORT_REQUEST' as const, title: 'Request for Support - Sobriety Journey', content: 'Please support my continued journey in recovery. One day at a time.', status: 'PUBLISHED' as const },
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
    { name: 'Wedding Ceremonies', description: 'Beautiful wedding services performed by Reverend Lovejoy. "Do you take this... oh, just say I do already!"', category: 'CEREMONY' as const, pricing: '$500-1000', isPublic: true },
    { name: 'Pastoral Counseling', description: 'One-on-one guidance and support. Reverend Lovejoy will try to stay awake.', category: 'COUNSELING' as const, pricing: 'Free for members', isPublic: true },
    { name: 'Sunday School', description: 'Teaching the little ones about faith, one flannel board at a time. "Now, who can tell me what happened to the Egyptians?"', category: 'EDUCATION' as const, pricing: 'Free', isPublic: true },
    { name: 'Adult Bible Study', description: 'Deep dives into scripture for grown-ups. Ned brings the study guides, Helen brings the gossip.', category: 'EDUCATION' as const, pricing: 'Free', isPublic: true },
  ];

  for (const service of serviceOfferings) {
    const existing = await prisma.serviceOffering.findFirst({
      where: { tenantId: tenant.id, name: service.name }
    });
    if (!existing) {
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
  }

  console.log(`✅ Created ${serviceOfferings.length} service offerings`);

  // 21. CREATE MEMORIALS
  const memorials = [
    { 
      name: 'Maude Flanders', 
      birthDate: new Date('1960-03-15'), 
      deathDate: new Date('2000-02-13'),
      obituary: 'Beloved wife, mother, and the sweetest soul in Springfield. Gone too soon due to a tragic t-shirt cannon incident. She made the best apple pie and always had a kind word for everyone.',
      createdBy: 1
    },
    { 
      name: 'Frank Grimes', 
      birthDate: new Date('1965-08-22'), 
      deathDate: new Date('1997-05-04'),
      obituary: 'Hard worker who lived above a bowling alley and below another bowling alley. He earned everything the hard way. His work ethic was an inspiration to... well, someone, probably.',
      createdBy: 2
    },
    {
      name: 'Bleeding Gums Murphy',
      birthDate: new Date('1944-07-08'),
      deathDate: new Date('1995-10-01'),
      obituary: 'The greatest jazz musician Springfield ever knew. He taught Lisa everything about the blues. His saxophone still echoes through the streets of Springfield on quiet nights.',
      createdBy: 5
    },
  ];

  for (const memorial of memorials) {
    const existing = await prisma.memorial.findFirst({
      where: { tenantId: tenant.id, name: memorial.name }
    });
    if (!existing) {
      await prisma.memorial.create({
        data: {
          tenantId: tenant.id,
          name: memorial.name,
          birthDate: memorial.birthDate,
          deathDate: memorial.deathDate,
          story: memorial.obituary,
          submitterId: users[memorial.createdBy].id,
          status: 'APPROVED',
        }
      });
    }
  }

  console.log(`✅ Created ${memorials.length} memorials`);

  // 22. CREATE MORE CONTACT SUBMISSIONS (acting as tickets)
  const moreContactSubmissions = [
    { 
      name: 'Homer Simpson',
      email: 'homer@springfield.org',
      message: 'Pew cushion is too comfortable - I keep falling asleep during the sermon. Can we get less comfortable pews? Or maybe just poke me when I snore.',
      status: 'UNREAD' as const
    },
    { 
      name: 'Bart Simpson',
      email: 'bart@springfield.org',
      message: 'Someone keeps stealing my skateboard from the rack every Sunday. I suspect Nelson. Can we install cameras? Eat my shorts!',
      status: 'READ' as const
    },
    { 
      name: 'Helen Lovejoy',
      email: 'helen@springfield.org',
      message: 'URGENT: The Sunday school needs more craft supplies. The children are suffering! SUFFERING! Won\'t somebody PLEASE think of the children?!',
      status: 'UNREAD' as const
    },
    { 
      name: 'Mr. Burns',
      email: 'burns@springfield.org',
      message: 'I require seventeen copies of my donation receipt for my accountants. Excellent.',
      status: 'ARCHIVED' as const
    },
  ];

  for (const contact of moreContactSubmissions) {
    const existing = await prisma.contactSubmission.findFirst({
      where: { tenantId: tenant.id, email: contact.email, message: { contains: contact.message.substring(0, 30) } }
    });
    if (!existing) {
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
  }

  console.log(`✅ Created ${moreContactSubmissions.length} additional contact submissions`);

  // 23. CREATE TASKS (Workboard)
  const tasks = [
    { assignee: 1, title: 'Order new hymnals', description: 'The old ones are getting a bit worn. Ned noticed page 42 is missing from three of them.', dueDate: new Date('2025-12-20'), status: 'TODO' as const, priority: 'NORMAL' as const },
    { assignee: 19, title: 'Fix leak in fellowship hall', description: 'There\'s a wee leak near the coffee station. Groundskeeper Willie will handle it, aye!', dueDate: new Date('2025-12-15'), status: 'IN_PROGRESS' as const, priority: 'HIGH' as const },
    { assignee: 3, title: 'Organize potluck signup', description: 'Need to create the signup sheet for the Christmas potluck. No more than 5 jello molds this year!', dueDate: new Date('2025-12-10'), status: 'DONE' as const, priority: 'NORMAL' as const },
    { assignee: 0, title: 'Prepare Christmas sermon', description: 'Reverend Lovejoy needs to write the Christmas Eve message. Something inspiring this time!', dueDate: new Date('2025-12-24'), status: 'TODO' as const, priority: 'URGENT' as const },
    { assignee: 11, title: 'Update church bulletin board', description: 'Principal Skinner volunteered to organize the announcements. He promises no detention slips.', dueDate: new Date('2025-12-08'), status: 'TODO' as const, priority: 'LOW' as const },
  ];

  for (const task of tasks) {
    const existing = await prisma.task.findFirst({
      where: { tenantId: tenant.id, title: task.title }
    });
    if (!existing) {
      await prisma.task.create({
        data: {
          tenantId: tenant.id,
          assigneeId: users[task.assignee].id,
          createdById: users[0].id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
        }
      });
    }
  }

  console.log(`✅ Created ${tasks.length} tasks`);

  // 24. CREATE ASSETS
  const assets = [
    { name: 'Church Van', description: 'The trusty Springfield Community Church van. Seats 12, barely runs, but gets us there!', category: 'VEHICLE' as const, serialNumber: 'VAN-001', purchaseDate: new Date('2015-06-01'), value: 15000 },
    { name: 'Sound System', description: 'Professional audio system for the sanctuary. Moe accidentally spilled beer on it once.', category: 'EQUIPMENT' as const, serialNumber: 'AUDIO-001', purchaseDate: new Date('2020-03-15'), value: 8000 },
    { name: 'Projector', description: 'High-def projector for worship slides and the occasional movie night. Still has Burns\' face stuck on it from his "donation appreciation" presentation.', category: 'EQUIPMENT' as const, serialNumber: 'PROJ-001', purchaseDate: new Date('2022-01-10'), value: 2500 },
    { name: 'Organ', description: 'Beautiful pipe organ from 1952. Needs tuning every month. Smithers plays it excellently.', category: 'INSTRUMENTS' as const, serialNumber: 'ORG-001', purchaseDate: new Date('1952-12-01'), value: 50000 },
  ];

  for (const asset of assets) {
    const existing = await prisma.asset.findFirst({
      where: { tenantId: tenant.id, name: asset.name }
    });
    if (!existing) {
      await prisma.asset.create({
        data: {
          tenantId: tenant.id,
          name: asset.name,
          description: asset.description,
          category: asset.category,
          serialNumber: asset.serialNumber,
          purchaseDate: asset.purchaseDate,
          purchasePrice: asset.value,
          currentValue: asset.value,
          status: 'AVAILABLE',
        }
      });
    }
  }

  console.log(`✅ Created ${assets.length} assets`);

  // 25. CREATE MORE COMMUNITY POSTS (Support Requests, Tangible Needs)
  const moreCommunityPosts = [
    { author: 2, type: 'SUPPORT_REQUEST' as const, title: 'Support for my bowling struggles', content: 'My bowling average has dropped to 120. I need community support! Also, Marge says support my diet journey. - Homer', status: 'PUBLISHED' as const },
    { author: 1, type: 'SUPPORT_REQUEST' as const, title: 'The Leftorium is saved!', content: 'Hi-diddly-ho! After months of struggle, the Leftorium is back in business! Thanks for all your support, neighborinos!', status: 'PUBLISHED' as const },
    { author: 17, type: 'TANGIBLE_NEED' as const, title: 'Need: Stage makeup for clown ministry', content: 'Hey hey, kids! Krusty needs some new stage makeup for the children\'s program. The red nose is fading!', status: 'PUBLISHED' as const },
    { author: 5, type: 'SUPPORT_REQUEST' as const, title: 'Support for my jazz audition', content: 'I have a big saxophone audition next week. Sending good vibes for steady fingers and soulful notes! - Lisa', status: 'PUBLISHED' as const },
  ];

  for (const cpost of moreCommunityPosts) {
    const existing = await prisma.communityPost.findFirst({
      where: { tenantId: tenant.id, body: { contains: cpost.content.substring(0, 50) } }
    });
    if (!existing) {
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
  }

  console.log(`✅ Created ${moreCommunityPosts.length} additional community posts`);

  // 26. CREATE MORE SMALL GROUPS
  const moreSmallGroups = [
    { leader: 5, name: 'Youth Jazz & Scripture', description: 'Where Lisa teaches kids about music and faith. Saxophone optional but encouraged!', status: 'OPEN' as const },
    { leader: 0, name: 'Marriage Enrichment', description: 'For couples who want to strengthen their bonds. Reverend Lovejoy reluctantly leads this one.', status: 'OPEN' as const },
    { leader: 17, name: 'Recovery Support Group', description: 'A safe space for those on their recovery journey. Krusty and Barney co-lead with empathy and humor.', status: 'OPEN' as const },
  ];

  for (const group of moreSmallGroups) {
    const existing = await prisma.smallGroup.findFirst({
      where: { tenantId: tenant.id, name: group.name }
    });
    if (!existing) {
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
  }

  console.log(`✅ Created ${moreSmallGroups.length} additional small groups`);

  // 27. CREATE MORE EVENTS
  const moreEvents = [
    { creator: 17, title: 'Krusty\'s Kids Comedy Hour', description: 'Hey hey! Bring the kids for some clean, family-friendly comedy. No pie-throwing, I promise! - Krusty', date: new Date('2025-12-20T14:00:00'), location: 'Fellowship Hall' },
    { creator: 19, title: 'Scottish Heritage Night', description: 'Groundskeeper Willie presents: bagpipes, haggis, and tales from the homeland. Kilts optional!', date: new Date('2025-12-18T18:00:00'), location: 'Fellowship Hall' },
    { creator: 5, title: 'Youth Jazz Concert', description: 'Lisa Simpson and friends perform jazz favorites. Featuring special guest: Bleeding Gums Murphy tribute!', date: new Date('2025-12-21T19:00:00'), location: 'Main Sanctuary' },
  ];

  for (const evt of moreEvents) {
    const existing = await prisma.event.findFirst({
      where: { tenantId: tenant.id, title: evt.title }
    });
    if (!existing) {
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
  }

  console.log(`✅ Created ${moreEvents.length} additional events`);

  // 28. CREATE MORE POSTS
  const morePosts = [
    { author: 12, title: 'A Generous Donation Announcement', content: 'I, Montgomery Burns, have graciously donated $10,000 to the church. Please rename the fellowship hall after me. Excellent.' },
    { author: 8, title: 'Moe\'s Testimony', content: 'Hey, it\'s Moe. Never thought I\'d be writing in a church newsletter, but here I am. This community has been real good to me. Thanks for not judging a guy by his bar.' },
    { author: 10, title: 'Chief Wiggum\'s Safety Tips', content: 'Remember folks: lock your cars in the parking lot. We\'ve had reports of someone leaving donut crumbs everywhere. Uh, that might be me. Carry on.' },
  ];

  for (const post of morePosts) {
    const existing = await prisma.post.findFirst({
      where: { tenantId: tenant.id, title: post.title }
    });
    if (!existing) {
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
  }

  console.log(`✅ Created ${morePosts.length} additional posts`);

  console.log('\n🍩 Springfield Community Church is ready!');
  console.log('📧 Login as admin@temple.com or any character email (password: T3mple.com)');
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

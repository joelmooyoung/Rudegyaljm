import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/database";
import {
  UserModel,
  StoryModel,
  LoginLogModel,
  ErrorLogModel,
  CommentModel,
} from "../models";

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await connectDB();

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await Promise.all([
      UserModel.deleteMany({}),
      StoryModel.deleteMany({}),
      LoginLogModel.deleteMany({}),
      ErrorLogModel.deleteMany({}),
      CommentModel.deleteMany({}),
    ]);

    // Create users with hashed passwords
    console.log("👥 Creating users...");
    const saltRounds = 12;

    const users = [
      {
        email: "admin@nocturne.com",
        username: "admin",
        password: await bcrypt.hash("admin123", saltRounds),
        role: "admin",
        isAgeVerified: true,
        isActive: true,
        subscriptionStatus: "none",
        lastLogin: new Date("2024-01-15"),
        createdAt: new Date("2024-01-01"),
      },
      {
        email: "premium@test.com",
        username: "premiumuser",
        passwordHash: await bcrypt.hash("premium123", saltRounds),
        role: "premium",
        isAgeVerified: true,
        isActive: true,
        subscriptionStatus: "active",
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastLogin: new Date("2024-01-14"),
        createdAt: new Date("2024-01-05"),
      },
      {
        email: "free@test.com",
        username: "freeuser",
        passwordHash: await bcrypt.hash("free123", saltRounds),
        role: "free",
        isAgeVerified: true,
        isActive: true,
        subscriptionStatus: "none",
        lastLogin: new Date("2024-01-13"),
        createdAt: new Date("2024-01-10"),
      },
      {
        email: "jane.doe@example.com",
        username: "janedoe",
        passwordHash: await bcrypt.hash("jane123", saltRounds),
        role: "free",
        isAgeVerified: true,
        isActive: false,
        subscriptionStatus: "none",
        lastLogin: new Date("2024-01-12"),
        createdAt: new Date("2024-01-08"),
      },
      {
        email: "john.smith@example.com",
        username: "johnsmith",
        passwordHash: await bcrypt.hash("john123", saltRounds),
        role: "premium",
        isAgeVerified: true,
        isActive: true,
        subscriptionStatus: "expired",
        subscriptionExpiry: new Date("2023-12-31"),
        lastLogin: new Date("2024-01-11"),
        createdAt: new Date("2023-11-15"),
      },
    ];

    const createdUsers = await UserModel.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create stories
    console.log("📚 Creating stories...");
    const stories = [
      {
        title: "Midnight Desires",
        excerpt:
          "A forbidden encounter under the starlit sky ignites a passion that defies all reason...",
        content: `The clock struck midnight as Sophia stepped onto the moonlit balcony, her silk nightgown flowing in the gentle breeze. She had been unable to sleep, her mind consumed by thoughts of the mysterious stranger she'd met at the masquerade ball just hours before.

His touch had been electric, sending shivers down her spine as they danced in the dimly lit ballroom. The way he'd whispered her name, his breath warm against her ear, had awakened something primal within her—a desire she'd never known existed.

Now, as she gazed up at the stars, she heard the soft rustle of leaves below. Her heart raced as a familiar figure emerged from the shadows of the garden. It was him—the man who had captivated her so completely with just one dance.

"I couldn't stay away," he called softly, his voice carrying on the night air. "You've bewitched me completely."

Sophia's breath caught in her throat. Every rational thought told her to retreat to her room, to forget this dangerous attraction. But her body betrayed her, moving of its own accord toward the spiral staircase that led to the garden below.

The forbidden nature of their meeting only heightened her arousal. She was a married woman, bound by duty and societal expectations, yet here she was, descending into the garden to meet a man whose name she didn't even know.

As she reached the bottom of the stairs, he stepped forward, his eyes drinking in the sight of her. "You came," he murmured, his voice thick with desire.

"I shouldn't have," she whispered, even as she moved closer to him.

"But you did." His hand reached out to caress her cheek, and she leaned into his touch, her resolve crumbling like sand. "Some things are worth the risk."

The garden around them seemed to pulse with an otherworldly energy as he drew her into his arms. The scent of jasmine filled the air, mixing with the intoxicating aroma of his cologne. When his lips finally met hers, it was with a passion that set her very soul on fire.

Their kiss deepened, becoming more urgent, more desperate. His hands tangled in her hair while hers explored the strong contours of his chest beneath his crisp white shirt. Time seemed to stand still as they lost themselves in each other, the rest of the world fading away.

But passion this intense could not be contained to a single night. As dawn approached, they made a pact to meet again, knowing that what they had discovered in each other was too powerful to abandon, regardless of the consequences.

This was just the beginning of a love affair that would challenge everything they thought they knew about desire, duty, and the courage to follow one's heart into the unknown.`,
        author: "Luna Starweaver",
        category: "Romance",
        tags: ["Passionate", "Forbidden Love", "Midnight", "Garden", "Desire"],
        accessLevel: "free",
        isPublished: true,
        rating: 4.8,
        ratingCount: 127,
        viewCount: 2340,
        commentCount: 23,
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-12"),
      },
      {
        title: "The Executive's Secret",
        excerpt:
          "Behind the mahogany doors of power, a CEO harbors desires that could destroy everything...",
        content: `Victoria Cross commanded respect in every boardroom she entered. As the youngest female CEO in the city's financial district, she had clawed her way to the top through determination, intelligence, and an unwavering focus on success. But behind her polished exterior and designer suits lay secrets that could unravel everything she had built.

It started innocently enough—late nights at the office, working alongside her brilliant and devastatingly handsome CFO, Marcus Reed. Their professional relationship had always been marked by mutual respect and undeniable chemistry that they had both fought to keep under control.

The evening everything changed began like any other. The office building was nearly empty, save for the soft glow emanating from the executive floor. Victoria was reviewing quarterly reports when Marcus knocked on her door, his tie loosened and his usually perfect hair slightly disheveled from the long day.

"Still working?" he asked, stepping into her office with two cups of coffee.

She looked up from her papers, acutely aware of how the lamplight caught the golden flecks in his brown eyes. "You know how it is. The company never sleeps."

Marcus set one cup on her desk and settled into the chair across from her. "Sometimes I wonder if you ever let yourself just... live."

The question hung in the air between them, loaded with implications neither had dared voice before. Victoria felt her carefully constructed walls beginning to crack.

"What do you mean?" she asked, though she knew exactly what he meant.

"When was the last time you did something just because it felt good? Not because it was strategic or profitable, but because it made you feel alive?"

Victoria's pulse quickened. The rational part of her mind screamed warnings about workplace relationships, about the scandal it could cause, about everything she stood to lose. But another part of her, a part she had suppressed for far too long, whispered seductively about what she stood to gain.

"Marcus..." she began, but he held up a hand.

"I know what you're going to say. I know all the reasons why this is complicated. But I also know that every time we're in a room together, there's something electric between us. Something neither of us can ignore much longer."

He was right, and they both knew it. The tension that had been building between them for months was becoming impossible to contain. Victoria found herself standing, moving around her desk toward him as if drawn by an invisible force.

"This could ruin everything," she whispered, even as her hand reached out to touch his face.

"Or it could be the beginning of everything," he replied, catching her hand and pressing it against his cheek.

When he stood and pulled her into his arms, all of her fears and reservations melted away. His kiss was gentle at first, tentative, as if he were afraid she might change her mind. But when she responded with equal fervor, deepening the kiss and pressing her body against his, his restraint crumbled.

What followed was a passionate encounter that shattered every rule Victoria had ever set for herself. Against the floor-to-ceiling windows of her office, with the city lights twinkling below, they discovered a connection that transcended their professional relationship.

But as the sun rose over the city skyline, reality began to set in. They were no longer just CEO and CFO—they were lovers, and the implications of that change would ripple through every aspect of their lives.

The secret they now shared would either bind them together or tear apart everything they had worked to build. Only time would tell which force would prove stronger: their desire for each other or the ruthless world of corporate power that demanded they remain nothing more than colleagues.`,
        author: "Scarlett Blackthorne",
        category: "Romance",
        tags: ["Office Romance", "Power", "CEO", "Forbidden", "Executive"],
        accessLevel: "premium",
        isPublished: true,
        rating: 4.9,
        ratingCount: 89,
        viewCount: 1580,
        commentCount: 34,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      {
        title: "Summer Heat",
        excerpt:
          "A chance encounter at a beach resort leads to seven days of unbridled passion...",
        content: `The Mediterranean sun beat down mercilessly on the pristine white sands of the exclusive resort, but Isabella barely noticed the heat as she lounged by the infinity pool. She had come to Greece to escape—escape the pressure of her high-powered job, escape the expectations of her family, and most importantly, escape the lingering heartbreak from her recent divorce.

She never expected to be rescued from her solitude by a stranger with sun-kissed skin and eyes the color of the Aegean Sea.

"Mind if I join you?" The voice was smooth, accented with just a hint of something exotic that made her pulse quicken.

Isabella looked up from her book to find a man standing beside her lounger, and her breath caught in her throat. He was beautiful in the way that Greek statues were beautiful—all carved muscle and masculine grace, with dark hair that caught the sunlight and a smile that promised adventure.

"I'm Alessandro," he said, extending his hand. "And you look like someone who could use some company."

She should have said no. Should have politely declined and returned to her book. Instead, she found herself accepting his hand, feeling a jolt of electricity at the contact.

"Isabella," she replied, surprised by the breathiness in her own voice.

What started as innocent conversation over cocktails by the pool quickly evolved into something much more intense. Alessandro was charming and mysterious, a successful architect from Rome who was taking a much-needed vacation between projects. He made her laugh in ways she hadn't in years, and when he looked at her, she felt beautiful again—not just attractive, but genuinely desired.

By the third day, she was completely under his spell. Their connection went beyond mere physical attraction, though the chemistry between them was undeniable. He seemed to understand her need for freedom, for the chance to be someone other than the responsible, careful woman she had always been.

"Come with me," he whispered one evening as they watched the sunset from his private balcony, his arms wrapped around her from behind. "I want to show you the real Greece."

The next morning, they escaped the resort on his rented motorcycle, racing through winding coastal roads toward hidden beaches and ancient ruins. The wind whipped through her hair as she clung to him, feeling more alive than she had in years.

They made love for the first time on a secluded beach, surrounded by nothing but crystalline water and ancient olive trees. The passion that had been building between them finally erupted in a display of desire so intense it left them both breathless and transformed.

Alessandro was an attentive and skilled lover, worshipping her body with a reverence that made her feel like a goddess. Under his touch, she discovered parts of herself she never knew existed—a wild, sensual woman who had been hiding beneath years of responsibility and restraint.

Each day brought new adventures and deeper intimacy. They explored secluded coves where they could swim naked in the warm Mediterranean waters. They shared intimate dinners at tavernas tucked away in mountain villages where no one knew their names or their stories.

But as the week progressed, the reality of their situation began to intrude. Isabella had a life to return to, a career that demanded her attention, and responsibilities that couldn't be ignored indefinitely. Alessandro, too, had commitments waiting for him in Rome.

"What happens when this ends?" she asked on their last night together, as they lay tangled in silk sheets while moonlight streamed through the open balcony doors.

"Who says it has to end?" he replied, his fingers tracing lazy patterns on her bare skin.

But they both knew it wasn't that simple. They lived in different countries, spoke different languages as their mother tongues, and had built separate lives that seemed impossible to merge.

Their last morning together was bittersweet, filled with promises to stay in touch and vows to find a way to be together again. As Isabella boarded her plane back to reality, she carried with her not just memories of the most passionate week of her life, but the knowledge that she was capable of feeling desire and joy in ways she had never imagined.

The question that would haunt her in the weeks to come was whether what they had shared was real enough to survive the test of distance and time, or if it was simply a beautiful dream meant to remain forever in the golden light of that perfect Mediterranean summer.`,
        author: "Marina Solace",
        category: "Romance",
        tags: [
          "Beach Romance",
          "Vacation",
          "Mediterranean",
          "Summer",
          "Passion",
        ],
        accessLevel: "free",
        isPublished: true,
        rating: 4.6,
        ratingCount: 156,
        viewCount: 2890,
        commentCount: 45,
        createdAt: new Date("2024-01-08"),
        updatedAt: new Date("2024-01-08"),
      },
      {
        title: "Dragons of Eldoria",
        excerpt:
          "In a realm where dragons soar and magic reigns, a forbidden love ignites between species...",
        content: `In the mystical realm of Eldoria, where ancient magic flowed through every stone and leaf, the divide between humans and dragons had been absolute for over a thousand years. The Treaty of Flames, signed in blood and sealed with ancient magic, forbade any interaction between the species beyond the most formal diplomatic exchanges.

But Lyra Nightwhisper had never been one to follow rules.

As the realm's most gifted mage and daughter of the High Council's leader, she should have been the last person to break the sacred laws. Instead, she found herself scaling the treacherous peaks of Mount Drakmoor on a moonless night, her heart pounding with anticipation and fear in equal measure.

She had been meeting Thane in secret for three months now, ever since she had discovered him injured and in human form in the Whispering Woods. Dragons possessed the ability to take human shape, but it was considered shameful among their kind—a sign of weakness that most would never admit to.

Thane was different. In his human form, he was tall and powerfully built, with midnight-black hair and eyes that shifted from deep amber to molten gold depending on his mood. But it was his mind that had captivated her first—brilliant, curious, and refreshingly free from the prejudices that plagued both their species.

"You came," he said softly as she reached their usual meeting place, a hidden cave behind a curtain of crystalline water. In the dim light of her conjured flames, his skin seemed to glow with an inner fire that spoke to his draconic nature.

"I will always come," she replied, allowing him to draw her into his arms. The moment their skin touched, she felt the familiar surge of magic that occurred whenever they were close—as if their very souls were calling to each other across the void of species difference.

Their relationship had begun with cautious conversation and stolen glances, but it had quickly evolved into something much deeper and more dangerous. They talked for hours about magic and philosophy, about the unnecessary hatred between their peoples, and about dreams of a world where love could transcend the boundaries of flesh and blood.

But it was the physical aspect of their relationship that threatened to consume them both. When Thane kissed her, she could taste the dragon fire that lived just beneath his human facade. When he touched her, her magic responded in ways that defied every law of nature she had been taught.

"Show me," she whispered against his lips, as she had so many times before. "Show me your true self."

It was a request that both thrilled and terrified him. To reveal his dragon form was to make himself completely vulnerable, to trust her with not just his secret but his very life. If she were to betray him, if she were to tell the Council what they had been doing...

But when he looked into her violet eyes, glowing with love and acceptance, his fears melted away like snow in dragon fire. The transformation was both beautiful and terrible to behold—his human form stretching and expanding, scales erupting across his skin in waves of midnight black shot through with veins of silver.

When the change was complete, he stood before her in his true form: a magnificent dragon with scales that reflected starlight and eyes that burned with ancient wisdom. He was easily three times her height, with wings that could blot out the moon and claws that could tear through stone like parchment.

Yet when he lowered his great head to nuzzle against her hand, he was as gentle as a housecat.

"Beautiful," she breathed, running her fingers along the smooth scales of his snout. "You're absolutely beautiful."

Their love had transcended the physical long ago, but in this moment, with all barriers between them removed, it reached new heights of intimacy. She could feel his emotions through their magical connection—the love, the fear, the desperate hope that somehow they could find a way to be together without destroying both their worlds.

But even as they lost themselves in each other's embrace, they both knew that their secret could not remain hidden forever. The signs were already there: her father growing suspicious of her frequent absences, whispers among the dragon clans about one of their own spending too much time in human lands.

The Treaty of Flames had been written in blood for good reason. The last time humans and dragons had attempted to coexist, it had ended in a war that nearly destroyed both species. The magic that bound the treaty would not suffer their transgression indefinitely.

Soon, they would have to choose: give up their love to preserve the peace, or fight for it and risk igniting a conflict that could burn the world to ash.

As dawn approached and they were forced to part once again, both Lyra and Thane carried with them the terrible knowledge that their next meeting might be their last—and the even more terrible certainty that they would risk everything, including their lives, for just one more night in each other's arms.`,
        author: "Ember Dragonheart",
        category: "Fantasy",
        tags: ["Dragons", "Magic", "Forbidden Love", "Fantasy", "Shapeshifter"],
        accessLevel: "premium",
        isPublished: false,
        rating: 0,
        ratingCount: 0,
        viewCount: 45,
        commentCount: 2,
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-05"),
      },
      {
        title: "The Comedy Club Catastrophe",
        excerpt:
          "When a stand-up comedian's worst nightmare comes true on stage, she discovers that failure can lead to unexpected romance...",
        content: `Maya Rodriguez had been bombing on stage for exactly seven minutes and thirty-four seconds when she noticed him in the audience. While everyone else in the dingy comedy club was either checking their phones or making increasingly obvious trips to the bathroom, he was leaning forward, genuinely laughing at her terrible jokes.

This was supposed to be her big break—an open mic night at The Laugh Track, the most prestigious comedy club in the city. Instead, it was turning into a masterclass in how to clear a room faster than a fire alarm.

"So, I went to buy some camouflage pants the other day," she continued desperately, "but couldn't find any!" She waited for laughter that didn't come. "Anyone? No? Tough crowd tonight."

The man in the front row—tall, with brown hair that fell just slightly over his eyes and a smile that seemed to find her adorable rather than awful—chuckled and shook his head appreciatively. The simple sound gave her enough courage to continue.

"Okay, new strategy," Maya announced to the sparse audience. "Instead of telling jokes, I'm just going to narrate my own epic failure in real time. It'll be like Mystery Science Theater 3000, but with more crying and student debt."

This time, a few more people laughed, including a couple who had been halfway to the exit.

"Oh, look at that," she continued, emboldened. "The couple by the door stopped leaving. That's what we call progress in the comedy business. Set your bars low, people. Really, really low."

For the next three minutes, Maya turned her bombing into material, transforming her worst performance into something genuinely entertaining. She talked about her day job as a kindergarten teacher, about how five-year-olds were a tougher audience than drunk adults, and about how her mother still asked when she was going to get a "real job."

By the time she left the stage, the audience was actually applauding. More importantly, the brown-haired man was approaching the stage with two drinks in his hands.

"That was either the most brilliant anti-comedy routine I've ever seen, or you really did just bomb spectacularly and turn it into something amazing," he said, offering her one of the drinks.

"Definitely the second one," Maya replied, accepting the beer gratefully. "I had about fifteen minutes of carefully crafted material, and apparently it was all garbage. Who are you, my one fan?"

"Jake Morrison," he said, extending his hand. "And I'm actually a comedy writer. I work for Saturday Night Live."

Maya nearly choked on her beer. "You're kidding."

"Nope. And what you just did up there—that improvisation, that ability to turn disaster into comedy gold—that's exactly what we look for. Raw talent and the ability to think on your feet."

What started as professional interest quickly became something more personal as they talked late into the night. Jake was intelligent and funny, with an easy laugh and a way of making her feel like the most interesting person in the room. When he offered to walk her home, she found herself hoping the distance to her apartment was much longer than it actually was.

"So, do you always pick up bombing comedians at open mic nights?" she asked as they strolled through the quiet streets.

"Only the ones who make failure look that entertaining," he replied. "Besides, some of the best comedians I know had terrible first performances. Bombing builds character."

"In that case, I should have amazing character by now," Maya laughed. "I've been bombing consistently for two years."

"Two years of dedication to the craft," Jake corrected. "That's impressive persistence."

They had reached her building, but neither seemed eager to end the conversation. Maya found herself inviting him up for coffee, knowing full well that it was past midnight and coffee was probably the last thing either of them was thinking about.

Her apartment was small and cluttered with joke notebooks and coffee-stained comedy books, but Jake seemed charmed by the organized chaos.

"This is where the magic happens?" he asked, picking up a notebook filled with crossed-out punchlines and margin notes.

"This is where the magic dies a slow, painful death," Maya corrected. "But occasionally, something survives the process."

As Jake flipped through her notebook, Maya found herself studying his profile in the soft lamplight. There was something about him that made her feel simultaneously nervous and completely at ease—a rare combination that she recognized as dangerous.

"You know," he said, looking up from her notes, "you've got a really unique voice. It's observational, but there's this vulnerability underneath that makes people want to root for you."

"Is that your professional opinion or are you just trying to get me into bed?" Maya asked, then immediately blushed at her own boldness.

Jake grinned. "Can't it be both?"

What followed was a night of laughter, conversation, and eventually, a connection that surprised them both with its intensity. They talked about their dreams, their failures, and their fears about pursuing careers that required them to bare their souls to strangers on a regular basis.

When they finally kissed, it was with the same spontaneous energy that had saved Maya's set earlier that evening—unplanned, authentic, and absolutely perfect.

The next morning, Maya woke up to find Jake in her kitchen, attempting to make breakfast with the limited ingredients in her refrigerator.

"So," she said, wrapping her arms around his waist from behind, "was last night your way of scouting new talent for SNL?"

"Actually," he said, turning in her arms, "I was thinking more along the lines of scouting a new girlfriend. Think you might be interested in that position?"

Maya pretended to consider it seriously. "Well, the benefits package better be good. I have very high standards."

"How do you feel about front-row seats to comedy shows and unlimited access to a guy who actually laughs at your jokes?"

"Deal," she said, sealing it with a kiss.

Six months later, Maya would indeed get her shot at SNL, but by then she would realize that the best thing to come out of her catastrophic open mic night wasn't the career opportunity—it was finding someone who could see the comedy in her disasters and love her for them.`,
        author: "Chelsea Brightside",
        category: "Comedy",
        tags: ["Stand-up Comedy", "Romance", "Career", "New York", "Humor"],
        accessLevel: "free",
        isPublished: true,
        rating: 4.7,
        ratingCount: 203,
        viewCount: 3420,
        commentCount: 67,
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
      },
      {
        title: "Whispers in the Library",
        excerpt:
          "A late-night encounter between a librarian and a mysterious patron ignites a passion among the silent stacks...",
        content: `The old university library held secrets in more than just its ancient books. As head librarian, Elena Vasquez had always prided herself on knowing every corner of the vast building, from the public reading rooms to the restricted archives hidden in the basement. But lately, she had become aware of a new mystery that haunted the halls after closing time.

Someone was visiting the library at night.

It wasn't unheard of for graduate students to hide in the stacks until after hours, but this was different. Books were being moved, research materials carefully reshelved, and occasionally she would find small tokens left behind—a pressed flower marking a page of poetry, a handwritten note tucked into a volume of philosophy.

Elena should have reported it to security, should have had the building searched and the intruder removed. Instead, she found herself staying later and later, drawn by curiosity and something else she couldn't quite name.

It was on a rainy Thursday evening in October that she finally encountered him.

She had been working in the rare books section, cataloging a new acquisition of 18th-century manuscripts, when she heard the soft whisper of footsteps on the marble floor below. The library had been closed for over an hour, and she was certain she had locked all the doors herself.

Moving quietly to the balcony that overlooked the main reading room, Elena peered down through the ornate iron railings. A man stood before one of the tall windows, silhouetted against the storm-darkened glass. He was tall and lean, dressed in dark clothes that made him nearly invisible among the shadows of the stacks.

As she watched, he moved with practiced ease through the library, pulling books from shelves with the confidence of someone who knew exactly what he was looking for. There was something almost ritualistic about his movements, a reverence that spoke of deep love for the written word.

Elena should have called out, should have demanded to know how he had gotten in and what he was doing there. Instead, she found herself descending the stairs as quietly as possible, drawn by an inexplicable fascination.

"The library closes at nine," she said softly when she was close enough that her voice wouldn't echo through the vast space.

He turned slowly, and Elena's breath caught in her throat. He was younger than she had expected, perhaps in his early thirties, with dark hair that fell across intelligent gray eyes. His face was angular and striking, with the kind of classical features that belonged in Renaissance paintings.

"I know," he replied, his voice carrying a slight accent she couldn't place. "I apologize for the intrusion. I have... special permission to be here."

"From whom?" Elena asked, though she was beginning to suspect she already knew the answer. Professor Blackwood, the elderly department head who had hired her five years ago, had always been eccentric about security arrangements.

"A colleague," the man said evasively. "I'm conducting research that requires access to materials not available during regular hours."

Elena studied him for a long moment. Everything about him suggested he was telling the truth—his obvious familiarity with the library's layout, his careful handling of the books, the way he spoke about research with genuine passion.

"What kind of research?" she asked, moving closer.

"Medieval manuscripts," he replied. "Specifically, illuminated texts dealing with forgotten forms of knowledge. My name is Adrian Blackthorne."

The name meant nothing to her, but his presence certainly did. Standing close to him, Elena could feel an almost electric tension in the air, as if the very molecules around them were charged with possibility.

"I'm Elena," she said. "The head librarian. And I think I should probably ask you to leave."

"Probably," Adrian agreed, but neither of them moved.

Instead, they found themselves talking—about books, about research, about the magic that lived in places where knowledge was preserved and protected. Adrian's passion for his work was infectious, and Elena found herself sharing stories about rare books she had discovered, about the thrill of uncovering long-lost texts.

"Would you like to see something special?" she asked impulsively, surprising herself with the invitation.

Adrian's eyes lit up with genuine interest. "Always."

Elena led him deeper into the library, past sections that were closed to all but the most senior researchers. In a climate-controlled room behind three locked doors, she showed him the library's greatest treasure: a collection of illuminated manuscripts that dated back to the 9th century.

"They're beautiful," Adrian breathed, his reverence evident as Elena carefully opened one of the volumes. The pages glowed with gold leaf and vibrant pigments that had somehow survived centuries of history.

"Each one tells a story," Elena said, turning the pages slowly. "Not just the words, but the images, the way the scribes chose to interpret the text..."

She looked up to find Adrian watching her with an intensity that made her pulse quicken. There was something in his gaze that went beyond academic interest, something that suggested he found her passion as captivating as the manuscripts themselves.

"You love this," he observed quietly.

"More than anything," Elena admitted. "Sometimes I think I was meant to be a keeper of secrets."

"And what if someone wanted to share those secrets with you?" Adrian asked, moving closer. "What if they had secrets of their own to offer in return?"

Elena felt her heart racing as she realized how close they were standing, how the soft lighting of the rare books room cast everything in an intimate, golden glow. The storm outside had intensified, rain lashing against the windows and creating a sense of isolation from the outside world.

"That would depend on the secrets," she whispered.

Instead of answering with words, Adrian reached out to trace the line of her jaw with gentle fingers. The touch was electric, sending shivers through her entire body and awakening desires she had long suppressed in favor of her scholarly pursuits.

When he kissed her, it was with the same reverence he had shown for the ancient books—careful, appreciative, and deeply passionate. Elena melted into his embrace, her hands fisting in the soft material of his shirt as years of loneliness and dedication to duty fell away.

They made love among the ancient texts, their passion creating its own illuminated manuscript of desire and connection. Adrian worshipped her body with the same attention to detail he brought to his research, discovering every sensitive spot and hidden pleasure with scholarly thoroughness.

Afterward, as they lay entwined on the soft carpet beneath the watching eyes of centuries-old angels painted in gold and lapis lazuli, Elena realized that her mystery visitor had become something much more significant.

"Will you come back?" she asked, tracing patterns on his chest.

"Every night," Adrian promised. "If you'll have me."

As the storm raged outside, Elena realized that she had discovered something more valuable than any rare book: a love that transformed her sanctuary of solitude into a haven for two souls who understood that some of the most important stories were written not in ink, but in the intimate moments shared between kindred spirits.

But even as she lost herself in Adrian's arms, a small part of her mind wondered about the secrets he had mentioned, and whether their newfound love would survive the revelation of whatever truths he was keeping hidden in the shadows of her beloved library.`,
        author: "Isadora Moonwood",
        category: "Romance",
        tags: ["Library", "Academic", "Mysterious", "Gothic", "Intellectual"],
        accessLevel: "premium",
        isPublished: true,
        rating: 4.8,
        ratingCount: 76,
        viewCount: 1240,
        commentCount: 18,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    const createdStories = await StoryModel.insertMany(stories);
    console.log(`✅ Created ${createdStories.length} stories`);

    // Create some sample login logs
    console.log("📊 Creating sample login logs...");
    const loginLogs = [
      {
        userId: createdUsers[0]._id.toString(),
        email: createdUsers[0].email,
        ipAddress: "192.168.1.100",
        country: "🏢 Private Network",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        success: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        userId: createdUsers[1]._id.toString(),
        email: createdUsers[1].email,
        ipAddress: "8.8.8.8",
        country: "🇺🇸 United States",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        success: true,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        userId: createdUsers[2]._id.toString(),
        email: createdUsers[2].email,
        ipAddress: "203.0.113.1",
        country: "🇦🇺 Australia",
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0.4472.124",
        success: true,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ];

    const createdLoginLogs = await LoginLogModel.insertMany(loginLogs);
    console.log(`��� Created ${createdLoginLogs.length} login logs`);

    // Create some sample comments
    console.log("💬 Creating sample comments...");
    const comments = [
      {
        storyId: createdStories[0]._id.toString(),
        userId: createdUsers[1]._id.toString(),
        username: createdUsers[1].username,
        content:
          "Absolutely captivating! The imagery in this story is so vivid, I felt like I was right there in the garden.",
        isEdited: false,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
      {
        storyId: createdStories[0]._id.toString(),
        userId: createdUsers[2]._id.toString(),
        username: createdUsers[2].username,
        content:
          "Luna Starweaver has such a beautiful writing style. Can't wait to read more!",
        isEdited: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        storyId: createdStories[4]._id.toString(),
        userId: createdUsers[1]._id.toString(),
        username: createdUsers[1].username,
        content:
          "This made me laugh out loud! Love how Maya turned her failure into success.",
        isEdited: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    const createdComments = await CommentModel.insertMany(comments);
    console.log(`✅ Created ${createdComments.length} comments`);

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📈 Summary:");
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Stories: ${createdStories.length}`);
    console.log(`- Login Logs: ${createdLoginLogs.length}`);
    console.log(`- Comments: ${createdComments.length}`);
    console.log("\n🔐 Test accounts:");
    console.log("- Admin: admin@nocturne.com / admin123");
    console.log("- Premium: premium@test.com / premium123");
    console.log("- Free: free@test.com / free123");

    await disconnectDB();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;

/* Haaraya worksheets, L1–L6. Content from the Haaraya Worksheet Showcase (Word v2).
   Item types: pick, match, fill, sort, order, yesno, choose, write, fields, table, draw, text.
   The first line / first item of each Word Focus task comes from the book; the rest are new. */
window.HL_WS = window.HL_WS || {};
Object.assign(window.HL_WS, {
"S-01-06": {
 code:"S-01-06", title:"Nana's Pan", level:1, tafiya:"Tashi", band:"Pink", strand:"Soundables", focus:"The n sound",
 blurb:"Hearing n at the end of a word, and two new words to read: pin and nap.", twoPart:true,
 wf:[
  {t:"pick", h:"Hear It", q:"Say the name of each picture to yourself. Tap the pictures that end with the n sound, like pan.", pic:1,
   lines:[{o:["pan","Nana","tin"],a:[0,2]},{o:["sun","nose","van"],a:[0,2]}],
   key:"Line 1: pan and tin (not Nana: her name starts with n). Line 2: sun and van (not nose).", at:"one correct answer"},
  {t:"match", h:"Read It", q:"Read each word. Match it to the picture it goes with.", left:["pan","tin","pin","nap"], right:["nap","tin","pin","pan"], picR:1, a:[3,1,2,0],
   key:"pan to the pan, tin to the tin, pin to the pin, nap to the child napping.", at:"one correct answer"}
 ],
 ra:{page:"Page 4", lines:["Nana tips it."], purpose:"Blend tips, then read the whole line smoothly.", reads:1},
 ta:[
  {t:"choose", q:"What did Nana tip?", o:["tin","pan","cup"], pic:1, a:0, key:"The tin (option a), pages 3 to 4.", at:"one correct answer"},
  {t:"choose", q:"Which one is hot?", o:["spoon","pan on the cooker","tin"], pic:1, a:1, key:"The pan on the cooker (option b). Accept any sensible reason: it is cooking, there is steam.", at:"one correct answer"}
 ],
 sw:[
  {t:"fill", q:"Help Nana tidy her kitchen. Put the right word under each thing.", bank:["pan","tin","pin"], blanks:[{pic:"pan",a:["pan"]},{pic:"tin",a:["tin"]},{pic:"pin",a:["pin"]}],
   key:"pan, tin and pin under the matching pictures.", at:"one correct answer"},
  {t:"draw", q:"Draw one more thing that ends with the n sound, like pan. Write n under it.", labelPre:"Write n:", key:"Anything that ends with the n sound, e.g. a van, a bin, a hen, a sun, a fan, a pen, a can, with n written under it.", at:"example acceptable answers"}
 ],
 ch:{t:"fill", q:"Change one letter each time to make the next word.", blanks:[{pic:"pan",fixed:"pan"},{pic:"pin",a:["pin"]},{pic:"tin",a:["tin"]}], key:"pin, then tin.", at:"one correct answer"},
 r:{wf:["Circles at random; matches words by guessing.","Book line right but sun or van missed, or nose circled: listening to the start. Or two of four words matched.","Pan, tin, sun and van circled, Nana and nose left; all four words matched."],
  ra:["Cannot read tips even sound by sound.","Reads it sound by sound, or needs the prompt to blend.","Reads Nana tips it. smoothly, as whole words."],
  ta:["Points at random.","One answer right.","Both answers right."],
  sw:["Words missing or on the wrong pictures; no drawing.","Two of three words right, or a drawing that does not end with n.","All three words right and an own drawing that ends with the n sound."],
  b:"Writes pin and tin, changing one letter each time, without help."},
 g:{prep:"The book. Cards s, a, t, p, i, n. Pencils. Check the pictures can be named: pan, Nana, tin, sun, nose, van, cup, spoon.",
  deliv:"Part 1, alone (Word Focus, Show What You Know, Challenge): read every instruction aloud once and name the Hear It pictures together. Do not read the words pan, tin, pin or nap: the child reads those. Model one new item, then leave the group to work. Part 2, with you (Read It Again, Think About It): in the next guided session, one child at a time.",
  support:"If a child is stuck on a word, point under each letter and say: What sounds do you see? Blend them. Never tell a child the word.",
  listen:"Listen for Nana said as a name (you may give it), tips blended once if needed, then the whole line said again smoothly. If a child stops on tips, say: What sounds do you see? Blend them.",
  crit:{wf:"I can say the n sound. I can blend pan and tin.",ra:"I can blend pan and tin.",ta:"I can say what happened in the book, after hearing it read.",sw:"I can blend pan and tin. I can read the word snap."},
  next:{wf:"Say pan, tin and sun slowly, stretching the last sound. The child holds up a hand when they hear n.",ra:"Reread page 1 and page 3 together, sliding a finger under each word.",ta:"Look at pages 2 to 4 together and say what Nana does on each.",sw:"Play the Pan game from the lesson, using pin and nap as new cards."}}
},
"H-02-02": {
 code:"H-02-02", title:"Pull, Gani, Pull!", level:2, tafiya:"Tashi", band:"Red", strand:"Hafwas", focus:"The tricky word pull",
 blurb:"Telling pull apart from words that only look like it, then using it for new pulls.", twoPart:true,
 wf:[
  {t:"pick", h:"Spot It", q:"Tap pull every time you see it. Some words look like pull. Do not tap those.",
   lines:[{o:["pull","put","pull","up"],a:[0,2]},{o:["puff","pull","pill","pull"],a:[1,3]}],
   key:"Line 1: the 1st and 3rd. Line 2: the 2nd and 4th. put, up, puff and pill are not tapped.", at:"one correct answer"},
  {t:"fill", h:"Use It", q:"Put pull under every picture where someone pulls. Leave the other one empty.", bank:["pull"],
   blanks:[{pic:"Gani and the sack",a:["pull"]},{pic:"door",a:["pull"]},{pic:"goat on a rope",a:["pull"]},{pic:"ball",a:[""]}],
   key:"pull under Gani and the sack, the door and the goat. Nothing under the ball: kicking is not pulling.", at:"one correct answer"}
 ],
 ra:{page:"Page 10", lines:["Pull! Up it gets!"], purpose:"Read pull at a glance, and let your voice show the !", reads:1},
 ta:[
  {t:"choose", q:"Where did they pull the sack?", o:["up the step","into a car","down a hole"], pic:1, a:0, key:"Up the step (option a), page 9.", at:"one correct answer"},
  {t:"choose", q:"Which picture shows the end of the story?", o:["Gani alone, stuck","sack at the bottom of the step","Gani and Isa, sack inside"], pic:1, a:2, key:"Gani and Isa with the sack inside (option c), page 12.", at:"one correct answer"}
 ],
 sw:[
  {t:"fill", q:"Tug of war! Everyone is cheering. Put pull in each speech bubble.", bank:["pull"], bubble:1,
   blanks:[{pre:"Gani:",post:"!",a:["pull"]},{pre:"Isa:",post:"!",a:["pull"]},{pre:"A friend:",post:"!",a:["pull"]}], key:"pull in all three speech bubbles.", at:"one correct answer"},
  {t:"draw", q:"Draw something you pull at home. Write pull under it.", labelPre:"Write pull:", key:"Anything a child pulls: a drawer, a door, a bucket rope, a toy on a string, a zip, a chair, with pull written under it.", at:"example acceptable answers"}
 ],
 ch:{t:"fill", q:"Put or pull? Choose the right word for each picture.", bank:["put","pull"], blanks:[{pic:"cup on a table",a:["put"]},{pic:"rope",a:["pull"]}], key:"Cup on a table: put. Rope: pull.", at:"one correct answer"},
 r:{wf:["Circles every word that starts with pu; writes pull under the ball.","Book line right but circles puff or pill in line 2; or writes pull under some new pulls only.","Circles only pull in both lines and writes pull under the three pulls, not the ball."],
  ra:["Sounds out pull letter by letter, or says put.","Reads pull after a pause, or reads the line flatly.","Reads pull at a glance and reads the line with energy."],
  ta:["Points at random.","One answer right.","Both answers right."],
  sw:["Bubbles empty or with another word.","pull in some bubbles, or no drawing.","pull written in all three bubbles and a sensible pull drawing."],
  b:"Writes put and pull under the right pictures and can say why."},
 g:{prep:"The book. The word card for pull, and the card for put. Pencils. Check the pictures can be named: Gani and the sack, a door, a goat on a rope, a ball, a cup on a table, a rope.",
  deliv:"Part 1, alone (Word Focus, Show What You Know, Challenge): read every instruction aloud once and name the pictures together. Do not read the words in Spot It. Model one new item, then leave the group to work. Part 2, with you (Read It Again, Think About It): next guided session; hear Read It Again one child at a time.",
  support:"Say, Spell, Look closely with the pull card: two ls make one sound, and the u sounds as it does in put. Read it with me.",
  listen:"Listen for pull said straight away, with the same sound as in put, and for Up it gets! read as one quick phrase. If the child stops on gets, say: What sounds do you see? Blend them.",
  crit:{wf:"I can read pull on sight.",ra:"I can read pull on sight.",ta:"I can say what happened in the book, after hearing it read.",sw:"I can read pull on sight. I can hear that pull and put share a sound."},
  next:{wf:"Look closely: lay pull beside puff and pill. Which one has two ls? Read each with the child.",ra:"Flash pull among put, puff and pill cards, faster each round.",ta:"Turn pages 9 to 12 together and say where the sack goes.",sw:"Pull Together with a rope, saying pull at each heave; then put a cup down and say put."}}
},
"TF-03-02": {
 code:"TF-03-02", title:"Chinasa at the Market", level:3, tafiya:"Sauka", band:"Yellow", strand:"Tafiya Fiction", focus:"Story vocabulary",
 blurb:"Bunch and fresh, used for new things at the market, and a list of the child's own.",
 wf:[
  {t:"pick", h:"Vocabulary", q:"A bunch is a lot of one thing held together. Tap the bunch in each line.", pic:1, single:1,
   lines:[{o:["peppers","pepper"],a:[0]},{o:["banana","bananas"],a:[1]},{o:["keys","key"],a:[0]}],
   key:"Line 1: the bunch of peppers. Line 2: the bunch of bananas. Line 3: the bunch of keys.", at:"one correct answer"},
  {t:"fill", h:"Vocabulary", q:"Market sellers call out what they sell. Chinasa heard: Fresh okra! Make a call for each new stall. Use fish, milk or yam.", bank:["fish","milk","yam"],
   blanks:[{pic:"okra",pre:"Fresh",post:"!",fixed:"okra"},{pic:"fish",pre:"Fresh",post:"!",a:["fish"]},{pic:"milk",pre:"Fresh",post:"!",a:["milk"]},{pic:"yam",pre:"Fresh",post:"!",a:["yam"]}],
   key:"Fresh fish! Fresh milk! Fresh yam!", at:"one correct answer"}
 ],
 ra:{page:"Page 14", lines:["Chinasa runs to the market.","\u201CMama said pepper! Not okra! Not melon!\u201D"], purpose:"Make the second reading smoother. Let Chinasa sound in a hurry.", reads:2},
 ta:[
  {t:"choose", q:"What did Chinasa get first?", o:["okra","melon","lemons"], pic:1, a:1, key:"Melon (option b), page 5. She spotted okra first but got melon.", at:"one correct answer"},
  {t:"choose", q:"How does Mama feel on page 11?", o:["puzzled face","sleepy face","laughing face"], pic:1, a:0, key:"Puzzled (option a). Mama asks Pepper? because Chinasa has not brought any.", at:"one correct answer"},
  {t:"write", q:"Where did Chinasa set the stuff down? Find it on page 13 and copy it.", kw:["bench"], key:"on the bench", at:"one correct answer"}
 ],
 sw:[
  {t:"fields", q:"Chinasa needs a list! Copy Mama's word as number 1. Then add two things your family gets at the market.", lead:"My list",
   fields:[{l:"1. (Mama said)",kw:["pepper"]},{l:"2."},{l:"3."}],
   key:"Line 1: pepper, copied from the book. Lines 2 and 3: any two market items, spelt as the child can (yam, rice, fish, eggs, tomatoes, garri, oil, onions). Judge the idea, not the spelling.", at:"answers will vary"}
 ],
 ch:{t:"draw", q:"\u201CAnd the rest?\u201D said Mama. What should Chinasa do with all the rest? Draw it and write one word.", labelPre:"One word:", key:"Any sensible use: cook a soup with it, share it, sell it, save it for tomorrow, give it to a neighbour.", at:"answers will vary"},
 r:{wf:["Circles single items; leaves the calls empty.","Book line right but a new bunch missed; or calls copied with the wrong word.","All three bunches circled and three correct calls."],
  ra:["Cannot read the page even with blending.","Reads accurately but the second reading is no smoother.","Second reading is smoother, with the shouts read quickly."],
  ta:["Points at random; no answer to question 3.","One or two answers right.","All three right, with on the bench copied."],
  sw:["Nothing copied or added.","pepper copied but no own items, or own items only.","pepper copied and two sensible items added."],
  b:"Gives a sensible plan for the rest of the food and draws it."},
 g:{prep:"The book. Pencils. A few real market items if you have them: a pepper, a banana, a set of keys.",
  deliv:"Read each instruction aloud and work through the sheet with the group, section by section. Before Word Focus, say: The first line comes from our book. The next lines are new. Children answer questions 1 and 2 by pointing, and question 3 in writing. Hear Read It Again one child at a time.",
  support:"If a child is stuck on a word they must read, say: What sounds do you see? Blend them. Never tell a child a decodable word. You may read a name. Scribe list items 2 and 3 for a child who can say them but not yet write them, and record the help.",
  listen:"First reading: accurate, blending Chinasa's market words if needed. Second reading: smoother, with the three short shouts read quickly. Listen for a voice that sounds in a hurry.",
  crit:{wf:"I can tell you what Chinasa forgot.",ra:"I can read the market story unaided.",ta:"I can say what Mama asked for.",sw:"I can tell you what Chinasa forgot and why that is funny."},
  next:{wf:"Hold up one pepper and a bunch. Ask: which is a bunch? Then do the same with pencils.",ra:"Read the page with the child, then echo-read the shouts.",ta:"Look again at pages 3, 11 and 13 together.",sw:"One Thing Only from the lesson, with a list of three items."}}
},
"TP-04-01": {
 code:"TP-04-01", title:"Sun, Then Rain", level:4, tafiya:"Sauka", band:"Yellow", strand:"Tafiya Poetry", focus:"Poem vocabulary",
 blurb:"Sorting sun and rain words, and writing two weather lines of the child's own.",
 wf:[
  {t:"sort", h:"Vocabulary", q:"Read each word. Is it a sun word or a rain word? Put it in the right cloud.", words:["bright","wet","fresh","muddy","hot","drip","splash"], bins:["Sun cloud","Rain cloud"],
   a:[0,1,[0,1],1,0,1,1], book:[0,1,2,3], key:"Sun: bright, fresh, hot. Rain: wet, muddy, drip, splash. Accept fresh in the rain cloud if the child explains that rain makes things fresh.", at:"example acceptable answers"},
  {t:"pick", h:"Vocabulary", q:"Snug means warm, safe and close. Tap the snug picture in each line.", pic:1, single:1,
   lines:[{o:["kids inside","kids in the rain"],a:[0]},{o:["cat on a wet wall","cat in a box"],a:[1]},{o:["baby in a wrap","baby with no blanket"],a:[0]}],
   key:"Line 1: kids inside. Line 2: cat in a box. Line 3: baby in a wrap.", at:"one correct answer"}
 ],
 ra:{page:"Page 5", lines:["Then it all goes dark.","Down comes the rain."], purpose:"Make the second reading smoother. Drop your voice when it goes dark.", reads:2},
 ta:[
  {t:"choose", q:"What do the kids do on page 3?", o:["race","sleep","swim"], pic:1, a:0, key:"Race (option a), page 3.", at:"one correct answer"},
  {t:"choose", q:"The sun is back. What will the kids do next?", o:["go to bed","race out again","hide inside"], pic:1, a:1, key:"Race out again (option b). Accept any sensible reason: they raced for fun when it was sunny.", at:"one correct answer"},
  {t:"fields", q:"Copy two words from the poem that tell you about the rain.", row:1, fields:[{l:"1.",kw:["dark","rain","muddy","soft","wet"],exact:1},{l:"2.",kw:["dark","rain","muddy","soft","wet"],exact:1}], key:"Any two of: dark, rain, muddy, soft, wet.", at:"example acceptable answers"}
 ],
 sw:[
  {t:"fill", q:"Make your own weather lines. The first line is from the poem. Finish the second line with your own words.", lead:"The sun is up, the land is wide.",
   blanks:[{pre:"The rain is",post:",",a:null},{pre:"the yard is",post:".",a:null}], key:"Any two words that fit, e.g. The rain is wet, the yard is muddy. The rain is loud, the yard is a pond. Judge the meaning, not the spelling.", at:"answers will vary"}
 ],
 ch:{t:"order", q:"Put the poem in order. Number the pictures 1, 2, 3 and 4.", items:["kids hide inside","sun up","sun back","dark sky, rain"], pic:1, a:[1,3,0,2], key:"sun up 1, dark sky and rain 2, kids hide inside 3, sun back 4.", at:"one correct answer"},
 r:{wf:["Words placed at random; snug pictures chosen at random.","Book words sorted right but the new words wrong, or one snug line wrong.","All seven words sorted sensibly and all three snug pictures circled."],
  ra:["Cannot read the page.","Reads accurately but flatly both times.","Second reading is smoother, with the voice dropping for the rain."],
  ta:["Points at random; nothing copied.","One or two answers right.","All three right, with two rain words copied."],
  sw:["Gaps empty.","One gap filled, or words that do not fit rain.","Both gaps filled with words that fit."],
  b:"Puts all four pictures in the poem's order without help."},
 g:{prep:"The book. Pencils. If it is the rainy season, a quick look out of the window helps.",
  deliv:"Read each instruction aloud and work through the sheet with the group, section by section. Before Word Focus, say: The first line comes from our poem. The next lines are new. Questions 1 and 2 are answered by pointing, question 3 in writing. Hear Read It Again one child at a time.",
  support:"If a child is stuck on a word they must read, say: What sounds do you see? Blend them. Never tell a child a decodable word. For the poem frame, scribe the two words for a child who can say them but not yet write them, and record the help.",
  listen:"First reading: accurate. Second reading: smoother, with the voice dropping on dark and staying low for the rain. Listen for the pause at the full stop.",
  crit:{wf:"I can say where the weather changes.",ra:"I can read the poem aloud with expression.",ta:"I can name two things from the bright part of the poem.",sw:"I can say where the weather changes."},
  next:{wf:"Say a weather word; children stand for sun and crouch for rain. Use new words.",ra:"Model the two sentences, the child echoes, then reads alone.",ta:"Turn to pages 3, 5, 6 and 8 and talk about what changes.",sw:"Sun and Rain Voices from the lesson, then try the frame again."}}
},
"TFT-05-01": {
 code:"TFT-05-01", title:"Clever Tortoise", level:5, tafiya:"Tsalle", band:"Blue", strand:"Tafiya Folktale", focus:"The moral in action",
 blurb:"Clever tools for new everyday problems, and a plan for a kite stuck on a roof.",
 wf:[
  {t:"match", h:"Vocabulary", q:"Tortoise was clever. He used a tool to solve a problem. Match each problem to its clever tool.", left:["treat in a tree","ball under a bed","mango up high","bucket in a well"], right:["vine and stick","rope","broom","long pole"], picL:1, picR:1, a:[0,2,3,1],
   key:"Ball under a bed: broom. Mango up high: long pole. Bucket in a well: rope.", at:"one correct answer"},
  {t:"pick", h:"Vocabulary", q:"Tortoise was the least of them all: the smallest. Tap the least in each line.", single:1,
   lines:[{o:["Goat","Dog","Tortoise"],a:[2],ref:"WS-TFT-05-01-08"},{o:["cup, full","cup, half","cup, a drop"],a:[2],ref:"WS-TFT-05-01-09"},{o:["big pile","three nuts","small pile"],a:[1],ref:"WS-TFT-05-01-10"}],
   key:"Line 1: Tortoise. Line 2: the cup with a drop. Line 3: three nuts.", at:"one correct answer"}
 ],
 ra:{page:"Page 3", lines:["\u201CI will get it!\u201D said Goat.","He ran at the tree. Bang!"], purpose:"Make the second reading smoother. Let Goat sound sure of himself, then crash on Bang!", reads:2},
 ta:[
  {t:"choose", q:"Who came to the tree last?", o:["Goat","Tortoise","Dog"], pic:1, a:1, key:"Tortoise (option b), page 7.", at:"one correct answer"},
  {t:"choose", q:"How do you think Goat felt when the treat came down?", o:["sleepy","bored","surprised"], pic:1, a:2, say:1, key:"Surprised (option c). Accept a spoken reason: Goat said Tortoise was too little, and Tortoise did it.", at:"one correct answer"},
  {t:"write", q:"Find the word on page 3 that is the sound Goat made. Copy it.", kw:["bang"], key:"Bang", at:"one correct answer"}
 ],
 sw:[
  {t:"draw", q:"Your kite is stuck on a roof! Make a clever plan like Tortoise. Draw your plan.", lead:"Tortoise used: a vine and a stick.", labelPre:"I will use:", key:"Any sensible tool and plan: a long stick, a broom, a ladder, a rope with a stone tied on, asking someone tall to help. The drawing shows how the tool reaches the kite.", at:"answers will vary"}
 ],
 ch:{t:"fields", q:"Goat said Tortoise was far too little and weak. Write what Tortoise could say back.", lead:"Goat: \u201CYou are far too little and weak!\u201D", fields:[{l:"Tortoise:",rows:2}], key:"Any reply that carries the moral: A clever mind beats a big back! I may be little, but I can think. Watch me!", at:"example acceptable answers"},
 r:{wf:["Lines drawn at random; the biggest circled.","Book line understood but new problems matched wrongly, or one least line wrong.","All three problems matched and the least circled in every line."],
  ra:["Cannot read the page.","Reads accurately but the second reading is no smoother.","Second reading is smoother, with Goat's voice and a loud Bang!"],
  ta:["Points at random; nothing copied.","One or two answers right.","All three right, with Bang copied."],
  sw:["No plan drawn.","A plan with no tool named, or one that would not reach.","A sensible tool, named and drawn reaching the kite."],
  b:"Writes a reply to Goat that carries the tale's moral."},
 g:{prep:"The book. Pencils. A broom and a rope in the room help for the matching task.",
  deliv:"Read each instruction aloud and work through the sheet with the group, section by section. Before Word Focus, say: The first line comes from our tale. The next lines are new. Questions 1 and 2 are answered by pointing or aloud, question 3 in writing. Hear Read It Again one child at a time.",
  support:"If a child is stuck on a word they must read, say: What sounds do you see? Blend them. Never tell a child a decodable word. Scribe the tool name or the Challenge reply for a child who can say it but not write it, and record the help.",
  listen:"First reading: accurate. Second reading: smoother, with Goat's words bold and sure, a short pause at each full stop, and Bang! loud and sudden.",
  crit:{wf:"I can say why Goat and Dog failed.",ra:"I can read feast, vine and clever at a glance.",ta:"I can say why Goat and Dog failed.",sw:"I can say the tale's moral in my own words."},
  next:{wf:"Act out one problem with real objects: try with hands, then with the tool.",ra:"Echo-read the page: you read a sentence, the child repeats it.",ta:"Turn to pages 3, 7 and 11 and talk about who does what.",sw:"A Clever Mind from the lesson, with a new problem."}}
},
"TD-06-01": {
 code:"TD-06-01", title:"Momotaro, the Peach Boy", level:6, tafiya:"Tsalle", band:"Green", strand:"Tafiya Duniya", focus:"A world tale",
 blurb:"Brave, and all for one, judged in new situations, and a sharing table.",
 wf:[
  {t:"yesno", h:"Vocabulary", q:"Momotaro was brave. He stood up to the head demon. Read each one. Is it brave?", lines:["Momotaro stood up to the head demon.","Titi stood up for her little brother.","Emeka ran off when it was his turn to help."], a:[true,true,false],
   key:"Momotaro: yes. Titi: yes. Emeka: no.", at:"one correct answer"},
  {t:"pick", h:"Vocabulary", q:"One for all, and all for one means everyone helps each other. Tap the picture that shows it in each line.", pic:1, single:1,
   lines:[{o:["the four friends","the demons"],a:[0]},{o:["one boy keeps the ball","a team lifts a cup"],a:[1]},{o:["neighbours fix a roof","a man sits alone"],a:[0]}],
   key:"Line 1: the four friends. Line 2: the team lifting the cup. Line 3: the neighbours fixing the roof.", at:"one correct answer"}
 ],
 ra:{page:"Page 16", lines:["In rushed the dog, snap!","In leapt the monkey, quick and sly!"], purpose:"Use the commas and the exclamation marks. Pause at each comma.", reads:1},
 ta:[
  {t:"write", q:"What did the demons do at the end?", kw:["gave","sorry","back"], key:"They gave in, gave back everything they had taken, and said sorry (page 19). Any one is enough.", at:"example acceptable answers"},
  {t:"write", q:"Why were the man and his wife sad at the start?", kw:["child","baby","no son","children"], key:"They had no child (page 2).", at:"one correct answer"},
  {t:"write", q:"Why do you think the animals asked for dumplings?", key:"Example answers: they were hungry; the dumplings were the best in all Japan; it was a fair swap for their help.", at:"example acceptable answers"},
  {t:"write", q:"Which friend helped the most, do you think? Give one reason from the book.", rows:2, key:"Any friend with a reason from the book: the bird flew over the gate and let them in; the dog rushed in and snapped; the monkey leapt in, quick and sly.", at:"answers will vary"}
 ],
 sw:[
  {t:"table", q:"Momotaro shared his dumplings and made friends. Fill in the table with your own friends. The first row is done for you.", cols:["Friend","What I share","How they help"],
   rows:[["Dog","a dumpling","snapped at the demons"],[null,null,null],[null,null,null]], key:"Two rows, each with a real or imagined friend, something the child could share (food, a pencil, a turn on a phone), and a sensible way the friend helps.", at:"answers will vary"}
 ],
 ch:{t:"fields", q:"Make up a new animal for the story. What does it ask Momotaro, and how does it help?", fields:[{l:"Animal:"},{l:"It says:"},{l:"It helps by:"}], key:"Any animal with a request and a useful skill: a goat that asks for a dumpling and butts the gate open; a cat that sees in the dark.", at:"answers will vary"},
 r:{wf:["Ticks at random; circles at random.","Book items right but one new sentence or picture wrong.","All three ticks right and all three pictures circled."],
  ra:["Reads word by word, ignoring the punctuation.","Accurate, but pauses missing or in the wrong places.","Accurate, with a pause at each comma and lively expression."],
  ta:["No answers, or answers not from the book.","Two or three answers right.","All four answered, with a reason from the book for question 4."],
  sw:["Table empty.","One row filled, or a row that does not fit.","Two sensible rows."],
  b:"Invents an animal with a request and a useful way to help."},
 g:{prep:"The book. Pencils.",
  deliv:"Read the instructions with the group, then let children work with support. Before Word Focus, say: The first line comes from our tale. The next lines are new. Children write short answers to the four questions. Hear Read It Again one child at a time.",
  support:"If a child is stuck on a word, say: What sounds do you see? Blend them. Never tell a child a decodable word. You may read a name. Scribe a question answer for a child whose spoken answer is right but whose writing cannot yet hold it, and record the help.",
  listen:"Listen for a short pause at each comma, a bright, quick snap!, and the second sentence read with pace to the exclamation mark. Expression should match the action.",
  crit:{wf:"I can name Momotaro's three friends and how he got them.",ra:"I can read with phrasing.",ta:"I can say what the tale teaches.",sw:"I can say what the tale teaches."},
  next:{wf:"Talk about a brave act from school this week, then reread the sentences.",ra:"Model the page, mark the commas with a finger tap, then the child reads.",ta:"Return to pages 2, 8 to 12 and 15 to 19 and talk through each question.",sw:"Tales Across the Sea from the lesson."}}
}
});

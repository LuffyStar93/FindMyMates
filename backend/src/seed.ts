import bcrypt from "bcryptjs";
import sequelize from "./config/db";

// Models
import GameModes from "./models/GameModes";
import Games from "./models/Games";
import Reports from "./models/Reports";
import ReputationVotes from "./models/ReputationVotes";
import Tickets from "./models/Tickets";
import UserReport from "./models/UserReport";
import UserReputationVote from "./models/UserReputationVote";
import Users from "./models/Users";
import UserTicket from "./models/UserTicket";

async function resetTables() {
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

  const tables = [
    "UserReport",
    "UserReputationVote",
    "UserTicket",
    "UserRank",
    "ReputationVotes",
    "Reports",
    "Tickets",
    "LabelRanks",
    "GameModes",
    "Games",
    "Users",
  ];

  for (const t of tables) {
    await sequelize.query(`TRUNCATE TABLE ${t}`);
  }

  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function hash(pwd: string) {
  return bcrypt.hash(pwd, 10);
}

async function createUsers() {
  console.log("Seeding users…");

  const pwds = await Promise.all([
    hash("alicepass"),
    hash("bobpass"),
    hash("charliepass"),
    hash("dianepass"),
  ]);

  const users = await Users.bulkCreate(
    [
      {
        name: "Alice",
        pseudo: "alice01",
        email: "alice01@example.com",
        password: pwds[0],
        role: "Moderator",
      },
      {
        name: "Bob Dupond",
        pseudo: "bob",
        email: "bob@example.com",
        password: pwds[1],
      },
      {
        name: "Charlie Doe",
        pseudo: "charlie",
        email: "charlie@example.com",
        password: pwds[2],
      },
      {
        name: "Diane Leroy",
        pseudo: "diane",
        email: "diane@example.com",
        password: pwds[3],
      },
    ],
    { returning: true }
  );

  return users;
}

async function createGamesAndModes() {
  console.log("Seeding games & modes…");

  const [valorant, rocket, cs2] = await Games.bulkCreate(
    [
      { name: "Valorant", urlImage: "https://picsum.photos/seed/valo/200" },
      { name: "Rocket League", urlImage: "https://picsum.photos/seed/rl/200" },
      { name: "CS2", urlImage: "https://picsum.photos/seed/cs2/200" },
    ],
    { returning: true }
  );

  const modes = await GameModes.bulkCreate(
    [
      // Valorant
      { modeName: "Unrated 5v5", playersMax: 5, isRanked: false, gameId: valorant.id },
      { modeName: "Competitive 5v5", playersMax: 5, isRanked: true, gameId: valorant.id },

      // Rocket League
      { modeName: "1v1", playersMax: 1, isRanked: false, gameId: rocket.id },
      { modeName: "2v2", playersMax: 2, isRanked: true, gameId: rocket.id },
      { modeName: "3v3", playersMax: 3, isRanked: true, gameId: rocket.id },

      // CS2
      { modeName: "Premier 5v5", playersMax: 5, isRanked: true, gameId: cs2.id },
    ],
    { returning: true }
  );

  return { valorant, rocket, cs2, modes };
}

async function createTickets(users: Users[], modes: GameModes[]) {
  console.log("Seeding tickets…");

  const mValoComp = modes.find((m) => m.modeName === "Competitive 5v5")!;
  const mRL2v2 = modes.find((m) => m.modeName === "2v2")!;
  const mRL3v3 = modes.find((m) => m.modeName === "3v3")!;

  // Valorant
  const t1 = await Tickets.create({
    userId: users[0].id,
    gameModeId: mValoComp.id,
    capacity: 3,
    nbPlayers: 1,
    status: "open",
    isActive: true,
  });

  // RL 2v2
  const t2 = await Tickets.create({
    userId: users[1].id,
    gameModeId: mRL2v2.id,
    capacity: 2,
    nbPlayers: 1,
    status: "open",
    isActive: true,
  });

  // RL 3v3
  const t3 = await Tickets.create({
    userId: users[2].id,
    gameModeId: mRL3v3.id,
    capacity: 3,
    nbPlayers: 1,
    status: "open",
    isActive: true,
  });

  // Participants
  const join = async (ticket: Tickets, userId: number) => {
    await UserTicket.create({ ticketId: ticket.id, userId });
  };

  await join(t1, users[0].id); // Alice
  await join(t1, users[1].id); // Bob

  await join(t2, users[1].id); // Bob
  await join(t2, users[2].id); // Charlie

  await join(t3, users[2].id); // Charlie
  await join(t3, users[3].id); // Diane

  // Update nbPlayers
  for (const t of [t1, t2, t3]) {
    const count = await UserTicket.count({ where: { ticketId: t.id } });
    await t.update({ nbPlayers: count });
  }

  return { t1, t2, t3 };
}

async function addReputationVote(voterId: number, targetId: number, ticketId: number, type: "up" | "down") {
  const delta = type === "up" ? 1 : -1;

  const vote = await ReputationVotes.create({
    voteType: type,
    userId: targetId,
    ticketId,
  });

  await UserReputationVote.create({
    userId: voterId,
    reputationVoteId: vote.id,
  });

  const target = await Users.findByPk(targetId);
  await target!.update({
    reputationScore: (target?.reputationScore ?? 0) + delta,
  });
}

async function createVotesAndReports(users: Users[], t: { t1: Tickets; t2: Tickets; t3: Tickets }) {
  console.log("Seeding votes & reports…");

  const { t1, t2, t3 } = t;

  // Votes ticket 1
  await addReputationVote(users[0].id, users[1].id, t1.id, "up");
  await addReputationVote(users[1].id, users[0].id, t1.id, "down");

  // Votes ticket 2
  await addReputationVote(users[1].id, users[2].id, t2.id, "up");
  await addReputationVote(users[2].id, users[1].id, t2.id, "up");

  // Votes ticket 3
  await addReputationVote(users[2].id, users[3].id, t3.id, "down");
  await addReputationVote(users[3].id, users[2].id, t3.id, "up");

  // Reports t1
  const r1 = await Reports.create({
    description: "Insultes répétées.",
    status: "open",
    reason: "Insulte",
    userId: users[0].id,
    ticketId: t1.id,
  });
  await UserReport.create({ userId: users[1].id, reportId: r1.id });

  // Reports t2
  const r2 = await Reports.create({
    description: "Comportement toxique en vocal.",
    status: "in_progress",
    reason: "Propos racistes",
    userId: users[2].id,
    ticketId: t2.id,
  });
  await UserReport.create({ userId: users[1].id, reportId: r2.id });
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log("DB connected.");

    await resetTables();

    const users = await createUsers();
    const { modes } = await createGamesAndModes();
    const tickets = await createTickets(users, modes);
    await createVotesAndReports(users, tickets);

    console.log("Seed OK");
    process.exit(0);
  } catch (e) {
    console.error("Seed failed:", e);
    process.exit(1);
  }
}

main();
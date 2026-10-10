import { integer, real, sqliteTable, text, index, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{
 userId:text('user_id').primaryKey(),name:text('name').notNull(),color:text('color').notNull().default('#c1a4ff'),moveGoal:integer('move_goal').notNull().default(60),sessionGoal:integer('session_goal').notNull().default(3),mindfulGoal:integer('mindful_goal').notNull().default(18),createdAt:integer('created_at').notNull(),
});
export const tracks=sqliteTable('tracks',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),title:text('title').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),duration:real('duration').notNull(),bpm:real('bpm').notNull(),offset:real('offset').notNull().default(0),shared:integer('shared').notNull().default(0),createdAt:integer('created_at').notNull(),
},t=>[index('idx_tracks_owner').on(t.ownerId)]);
export const sessions=sqliteTable('sessions',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),mode:text('mode').notNull(),seconds:integer('seconds').notNull(),hits:integer('hits').notNull(),total:integer('total').notNull(),combo:integer('combo').notNull(),score:integer('score').notNull(),device:text('device').notNull(),completed:integer('completed').notNull(),createdAt:integer('created_at').notNull(),
 missionId:text('mission_id'),presetId:text('preset_id'),world:text('world'),coach:text('coach'),seated:integer('seated').notNull().default(0),roomId:text('room_id'),runId:text('run_id'),heartSummary:text('hr_summary'),clanId:text('clan_id'),journeyId:text('journey_id'),journeyStep:integer('journey_step'),customMissionId:text('custom_mission_id'),raveStyle:text('rave_style'),
},t=>[index('idx_sessions_owner_created').on(t.ownerId,t.createdAt)]);
export const missions=sqliteTable('missions',{
 ownerId:text('owner_id').notNull(),missionId:text('mission_id').notNull(),startedAt:integer('started_at').notNull(),completedAt:integer('completed_at'),
},t=>[primaryKey({columns:[t.ownerId,t.missionId]})]);
export const awards=sqliteTable('awards',{
 ownerId:text('owner_id').notNull(),achievementId:text('achievement_id').notNull(),earnedAt:integer('earned_at').notNull(),
},t=>[primaryKey({columns:[t.ownerId,t.achievementId]})]);
export const journeyEnrollments=sqliteTable('journey_enrollments',{
 ownerId:text('owner_id').notNull(),journeyId:text('journey_id').notNull(),nextStep:integer('next_step').notNull().default(0),startedAt:integer('started_at').notNull(),completedAt:integer('completed_at'),
},t=>[primaryKey({columns:[t.ownerId,t.journeyId]})]);
export const customMissions=sqliteTable('custom_missions',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),clanId:text('clan_id'),title:text('title').notNull(),activity:text('activity').notNull(),metric:text('metric').notNull(),target:integer('target').notNull(),createdAt:integer('created_at').notNull(),completedAt:integer('completed_at'),archivedAt:integer('archived_at'),
},t=>[index('idx_custom_missions_owner').on(t.ownerId),index('idx_custom_missions_clan').on(t.clanId)]);
export const rooms=sqliteTable('rooms',{
 id:text('id').primaryKey(),code:text('code').notNull(),title:text('title').notNull(),hostId:text('host_id').notNull(),state:text('state').notNull().default('lobby'),config:text('config').notNull(),startAt:integer('start_at'),runId:text('run_id'),expiresAt:integer('expires_at').notNull(),createdAt:integer('created_at').notNull(),clanId:text('clan_id'),
},t=>[uniqueIndex('idx_rooms_code').on(t.code),index('idx_rooms_expires').on(t.expiresAt)]);
export const members=sqliteTable('members',{
 roomId:text('room_id').notNull(),userId:text('user_id').notNull(),ready:integer('ready').notNull().default(0),lastSeen:integer('last_seen').notNull(),score:integer('score').notNull().default(0),pose:text('pose').notNull().default('[]'),
},t=>[primaryKey({columns:[t.roomId,t.userId]}),index('idx_members_user').on(t.userId)]);
export const messages=sqliteTable('messages',{
 id:text('id').primaryKey(),roomId:text('room_id').notNull(),userId:text('user_id').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('idx_messages_room_created').on(t.roomId,t.createdAt)]);
export const clans=sqliteTable('clans',{
 id:text('id').primaryKey(),code:text('code').notNull(),name:text('name').notNull(),description:text('description').notNull(),leaderId:text('leader_id').notNull(),color:text('color').notNull(),moveGoal:integer('move_goal').notNull().default(180),mindfulGoal:integer('mindful_goal').notNull().default(60),sessionGoal:integer('session_goal').notNull().default(12),timezone:text('timezone').notNull().default('America/Los_Angeles'),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('idx_clans_code').on(t.code)]);
export const clanMembers=sqliteTable('clan_members',{
 clanId:text('clan_id').notNull(),userId:text('user_id').notNull(),joinedAt:integer('joined_at').notNull(),
},t=>[primaryKey({columns:[t.clanId,t.userId]}),index('idx_clan_members_user').on(t.userId)]);
export const clanMessages=sqliteTable('clan_messages',{
 id:text('id').primaryKey(),clanId:text('clan_id').notNull(),userId:text('user_id').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('idx_clan_messages_created').on(t.clanId,t.createdAt)]);
export const clanCredits=sqliteTable('clan_credits',{
 sessionId:text('session_id').primaryKey(),clanId:text('clan_id').notNull(),ownerId:text('owner_id').notNull(),seconds:integer('seconds').notNull(),mode:text('mode').notNull(),completed:integer('completed').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('idx_clan_credits_created').on(t.clanId,t.createdAt)]);

const {express, BadRequest} = require("./utils/aexpress");
const SQLBuilder = require('./utils/SQLBuilder');
const {parseId} = require("./utils/utils");
const {validateUserHasAccessToCourse} = require("./courses");

const app = express();
const db = new SQLBuilder();

const validateValidDate = date => {
	if (!(date instanceof Date && !isNaN(date))) {
		throw new BadRequest('Invalid date', 'invalid_date');
	}
};

app.get_json('/statistics/words_known', async req => {
	let from = req.query.from ? new Date(req.query.from) : new Date(0)
	const to = req.query.to ? new Date(req.query.to) : new Date();
	const asGraph = Boolean(req.query.asGraph);

	validateValidDate(from);
	validateValidDate(to);

	const query = db.select('word_state')
		.fields('COUNT(*)')
		.where('"user" = ?', req.session.id)
		.where('state = ?', 'known')
		.where('changed >= ?', from)
		.where('changed <= ?', to);

	if (asGraph) {
		return await query
			.fields('COUNT(*), changed::date')
			.more('GROUP BY changed::date ORDER BY changed')
			.getList();
	} else {
		return Number((await query.fields('COUNT(*)').oneOrNone()).count);
	}
});

app.get_json('/statistics/daystreak', async req => {
	return (await db.runQuery(`
		WITH dates AS (
			SELECT DISTINCT at::date created_date FROM user_interactions WHERE "user" = ? AND event = 'LOGIN'
		),
		date_groups AS (
			SELECT
				created_date,
				created_date::DATE - CAST(row_number() OVER (ORDER BY created_date) as INT) AS grp
			FROM dates
		)
		SELECT max(created_date) - min(created_date) + 1 AS length
		FROM date_groups
		GROUP BY grp
		ORDER BY length DESC
		LIMIT 1`, [req.session.id]
	))[0]?.length || 0;
});

app.get_json('/statistics/learning_time', async req => {
	const courseId = req.query.course && parseId(req.query.course);
	let from = req.query.from ? new Date(req.query.from) : new Date(0)
	const to = req.query.to ? new Date(req.query.to) : new Date();
	const asGraph = Boolean(req.query.asGraph);

	validateValidDate(from);
	validateValidDate(to);

	if (courseId) {
		await validateUserHasAccessToCourse(courseId, req.session.id);
	}

	const query = db.select(`course_study_time`)
		.where('"user" = ?', req.session.id)
		.where('"from" >= ?', from)
		.where('"from" <= ?', to)

	if (courseId) {
		query.where('course = ?', courseId)
	}

	if (asGraph) {
		return await query
			.fields('SUM("to" - "from") AS learning, "from"::date')
			.more('GROUP BY "from"::date ORDER BY "from"').getList();
	} else {
		return (await query
			.fields('SUM("to" - "from") AS learning')
			.oneOrNone()
		).learning;
	}
});

app.get_json('/statistics/course-nodes-completion', async req => {
	const asGraph = Boolean(req.query.asGraph);
	let from = req.query.from ? new Date(req.query.from) : new Date(0)
	const to = req.query.to ? new Date(req.query.to) : new Date();

	validateValidDate(from);
	validateValidDate(to);

	const query = await db.select(`course_node_state`) // TODO make is as count endpoint
		.where('"user" = ?', req.session.id)
		.where('"when" >= ?', from)
		.where('"when" <= ?', to)

	if (asGraph) {
		return await query.fields('SUM(number_of_completion) AS number_of_completion, "when"::date')
			.more('GROUP BY "when"::date ORDER BY "when"').getList();
	} else {
		return (await query.fields('SUM(number_of_completion)::int AS count').oneOrNone()).count;
	}
});

module.exports = {app};
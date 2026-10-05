const require_game_object = require("./game-object.cjs");
const require_narrative_data = require("./narrative-data.cjs");
//#region dist/packages/core/src/quests.js
var QuestSystem = class extends require_game_object.GameObject {
	options;
	definitions;
	byId = /* @__PURE__ */ new Map();
	records = Object.create(null);
	mutating = !1;
	constructor(e, r = {}) {
		super(), this.options = r, this.definitions = require_narrative_data.immutableData(e);
		for (let e of this.definitions) {
			this.byId.set(e.id, e);
			let t = /* @__PURE__ */ new Set();
			if (!e.objectives.length) throw Error(`Quest requires objectives.`);
			let n = Object.create(null);
			for (let r of e.objectives) {
				if (!r.id || t.has(r.id) || !Number.isFinite(r.target) || r.target <= 0) throw Error(`Invalid quest objective.`);
				t.add(r.id), n[r.id] = 0;
			}
			this.records[e.id] = {
				status: e.prerequisites?.length ? `locked` : `available`,
				progress: n,
				rewarded: !1
			};
		}
		require_narrative_data.validateGraph(this.definitions.map((e) => e.id), (e) => this.byId.get(e).prerequisites ?? []);
	}
	get(e) {
		let t = this.records[e];
		if (!t || !this.byId.has(e)) throw Error(`Unknown quest: ${e}`);
		return {
			...t,
			progress: { ...t.progress }
		};
	}
	accept(e) {
		this.mutate(() => {
			let t = this.require(e, `available`);
			t.status = `active`, this.options.onTransition?.(e, `active`);
		});
	}
	progress(e, t, n = 1) {
		this.mutate(() => {
			let r = this.require(e, `active`), i = this.byId.get(e), a = i.objectives.find((e) => e.id === t)?.target;
			if (a === void 0 || !Number.isFinite(n) || n < 0) throw Error(`Invalid objective progress.`);
			if (r.progress[t] = Math.min(a, r.progress[t] + n), !i.objectives.every((e) => r.progress[e.id] === e.target)) return;
			r.status = `completed`, r.rewarded = !0;
			let o = [];
			for (let e of this.definitions) this.records[e.id].status === `locked` && e.prerequisites.every((e) => this.records[e].status === `completed`) && (this.records[e.id].status = `available`, o.push(e.id));
			if (this.options.onReward?.(i.rewards ?? [], e), !this.destroyed) {
				this.options.onTransition?.(e, `completed`);
				for (let e of o) {
					if (this.destroyed) break;
					this.options.onTransition?.(e, `available`);
				}
			}
		});
	}
	fail(e) {
		this.mutate(() => {
			let t = this.require(e, `active`);
			t.status = `failed`, this.options.onTransition?.(e, `failed`);
		});
	}
	save() {
		return {
			version: 1,
			quests: structuredClone(this.records)
		};
	}
	restore(e) {
		if (this.destroyed || this.mutating) throw Error(`Quest system cannot restore now.`);
		if (e.version !== 1 || !e.quests || Object.keys(e.quests).length !== this.definitions.length) throw Error(`Invalid quest state.`);
		for (let t of this.definitions) {
			let n = e.quests[t.id];
			if (!n || ![
				`locked`,
				`available`,
				`active`,
				`completed`,
				`failed`
			].includes(n.status) || typeof n.rewarded != `boolean` || !n.progress || Object.keys(n.progress).length !== t.objectives.length) throw Error(`Invalid quest record.`);
			for (let e of t.objectives) {
				let t = n.progress[e.id];
				if (!Number.isFinite(t) || t < 0 || t > e.target) throw Error(`Invalid saved objective progress.`);
			}
			let r = t.objectives.every((e) => n.progress[e.id] === e.target);
			if (n.status === `completed` !== n.rewarded || n.status === `completed` && !r || n.status === `active` && r) throw Error(`Inconsistent quest completion.`);
			let i = (t.prerequisites ?? []).every((t) => e.quests[t]?.status === `completed`);
			if (n.status === `locked` === i) throw Error(`Inconsistent quest prerequisites.`);
			if ((n.status === `available` || n.status === `locked`) && t.objectives.some((e) => n.progress[e.id] !== 0)) throw Error(`Inactive quest has progress.`);
		}
		this.records = structuredClone(e.quests);
	}
	require(e, t) {
		if (!this.byId.has(e) || this.records[e].status !== t) throw Error(`Quest ${e} is not ${t}.`);
		return this.records[e];
	}
	mutate(e) {
		if (this.destroyed || this.mutating) throw Error(`Quest mutation is not reentrant.`);
		this.mutating = !0;
		try {
			e();
		} finally {
			this.mutating = !1;
		}
	}
};
//#endregion
exports.QuestSystem = QuestSystem;

//# sourceMappingURL=quests.cjs.map
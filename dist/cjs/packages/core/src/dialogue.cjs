const require_game_object = require("./game-object.cjs");
const require_narrative_data = require("./narrative-data.cjs");
//#region dist/packages/core/src/dialogue.js
var Dialogue = class extends require_game_object.GameObject {
	options;
	definition;
	nodes = /* @__PURE__ */ new Map();
	values;
	current = null;
	begun = !1;
	transitioning = !1;
	constructor(e, t = {}) {
		if (super(), this.options = t, this.definition = require_narrative_data.immutableData(e), !e.id) throw Error(`Dialogue requires an ID.`);
		for (let e of this.definition.nodes) {
			if (this.nodes.set(e.id, e), e.next && e.choices?.length) throw Error(`A dialogue node cannot have both next and choices.`);
			require_narrative_data.validateVariables(e.set ?? {});
			let t = /* @__PURE__ */ new Set();
			for (let n of e.choices ?? []) {
				if (!n.id || t.has(n.id)) throw Error(`Dialogue choice IDs must be unique.`);
				t.add(n.id), require_narrative_data.validateCondition(n.condition), require_narrative_data.validateVariables(n.set ?? {});
			}
		}
		if (require_narrative_data.validateGraph(this.definition.nodes.map((e) => e.id), (e) => {
			let t = this.nodes.get(e);
			return [...t.next ? [t.next] : [], ...(t.choices ?? []).map((e) => e.next)];
		}, e.allowCycles), !this.nodes.has(e.start)) throw Error(`Unknown dialogue start.`);
		require_narrative_data.validateVariables(e.variables ?? {}), this.values = Object.assign(Object.create(null), e.variables);
	}
	get variables() {
		return { ...this.values };
	}
	get completed() {
		return this.begun && this.current === null;
	}
	get view() {
		if (this.current === null) return null;
		let e = this.nodes.get(this.current);
		return {
			node: e.id,
			text: require_narrative_data.narrativeText(e.text, this.values, this.options.i18n),
			speaker: e.speaker,
			choices: (e.choices ?? []).filter((e) => require_narrative_data.conditionMatches(e.condition, this.values)).map((e) => ({
				id: e.id,
				text: require_narrative_data.narrativeText(e.text, this.values, this.options.i18n)
			}))
		};
	}
	start() {
		this.transition(() => {
			if (this.begun) throw Error(`Dialogue has already started.`);
			this.begun = !0, this.enter(this.definition.start);
		});
	}
	advance() {
		this.transition(() => {
			let e = this.requireNode();
			if (e.choices?.length) throw Error(`Dialogue requires a choice.`);
			this.enter(e.next ?? null);
		});
	}
	choose(e) {
		this.transition(() => {
			let n = this.requireNode().choices?.find((t) => t.id === e);
			if (!n || !require_narrative_data.conditionMatches(n.condition, this.values)) throw Error(`Unavailable dialogue choice.`);
			Object.assign(this.values, n.set), this.current = n.next, this.emit(n.events), this.destroyed || this.enter(n.next);
		});
	}
	setVariable(e, t) {
		if (this.destroyed || this.transitioning) throw Error(`Dialogue cannot be mutated now.`);
		require_narrative_data.validateVariables({ [e]: t }), this.values[e] = t;
	}
	save() {
		return {
			version: 1,
			definition: this.definition.id,
			node: this.current,
			started: this.begun,
			variables: { ...this.values }
		};
	}
	restore(e) {
		if (this.destroyed || this.transitioning) throw Error(`Dialogue cannot restore now.`);
		if (e.version !== 1 || e.definition !== this.definition.id || typeof e.started != `boolean` || e.node !== null && !this.nodes.has(e.node) || !e.started && e.node !== null) throw Error(`Invalid dialogue state.`);
		require_narrative_data.validateVariables(e.variables), this.values = Object.assign(Object.create(null), e.variables), this.current = e.node, this.begun = e.started;
	}
	requireNode() {
		if (this.current === null) throw Error(`Dialogue is not active.`);
		return this.nodes.get(this.current);
	}
	enter(e) {
		if (this.current = e, e === null) return;
		let t = this.nodes.get(e);
		Object.assign(this.values, t.set), this.emit(t.events);
	}
	emit(e) {
		for (let t of e ?? []) {
			if (this.destroyed) break;
			this.options.onEvent?.(t, this);
		}
	}
	transition(e) {
		if (this.destroyed || this.transitioning) throw Error(`Dialogue transition is not reentrant.`);
		this.transitioning = !0;
		try {
			e();
		} finally {
			this.transitioning = !1;
		}
	}
};
//#endregion
exports.Dialogue = Dialogue;

//# sourceMappingURL=dialogue.cjs.map
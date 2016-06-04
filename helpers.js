'use strict'

const mercator = require('mercator-projection')
const bbox     = require('german-states-bbox').BE // Berlin
const parse    = require('vbb-parse-line')
const colors   = require('vbb-util/lines/colors')
const products = require('vbb-util/products')
const map      = require('through2-map')



const project = (lat, lng) => mercator.fromLatLngToPoint({lat, lng})

const left   = project(bbox[0], bbox[1]).x
const top    = project(bbox[0], bbox[1]).y
const right  = project(bbox[2], bbox[3]).x
const bottom = project(bbox[2], bbox[3]).y
const w = 900
const h = (bottom - top) / (right - left) * w
const translate = (lat, long) => {
	const coords = project(lat, long)
	return {
		  x: (coords.x - left) / (right - left) * w
		, y: (coords.y - top)  / (bottom - top) * h
	}
}
Object.assign(translate, {w, h})

const color = (line) => {
	line = parse(line)
	if (colors[line.type] && colors[line.type][line._])
		return colors[line.type][line._].bg
	if (products[line.type]) return products[line.type].color
	return '#333'
}

const round = (x) => Math.round(x * 10000) / 10000

const relative = (translate) => {
	let previous = {x: 0, y: 0}
	return map({objectMode: true}, (node) => {
		const x = translate.x(node.longitude)
		const y = translate.y(node.latitude)
		const delta = {dx: x - previous.x, dy: y - previous.y}
		previous = {x, y}
		return delta
	})
}



module.exports = {translate, color, round, relative}

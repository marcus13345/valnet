(async () => {
const { title } = require('../lib/title');
const net = require('net');
const log = require('signale').scope('relay');
const { config } = require('../package.json');
const { Identity } = require('../lib/Identity');
const stp = require('../lib/STP');
title('relay', false);
const identity = await new Identity('relay', 'default');

const clients = [];

// const client = stp.connect(identity, config.ports.relay, '127.0.0.1');

// ==================================== [STP SERVER]
stp.createServer({
	identity: identity,
	port: config.ports.relay
}, socket => {
	log.debug('loopback ' + socket.loopback)
	clients.push(socket);
});

const client = stp.connect({
	identity,
	port: config.ports.relay,
	ip: 'valnet.xyz'
});
client.on('error', e => {
	log.error(e)
})

// ==================================== [EXPRESS]
const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.end(`
		<style>
			td:not(:last-child), th:not(:last-child) {
				border-right: 1px solid black;
			}
			td, th {
				padding-left: 8px;
			}
			th {
				border-bottom: 3px solid black;
			}
			table {
				border-spacing: 0px;
				font-family: sans-serif;
				font-size: 13px;
			}
			tr:nth-child(2n) {
				background: #ccc;
			}
		</style>
		<table style="min-width: 300px">
			<tr>
				<th>Id</th>
				<th>Address</th>
				<th>loopback</th>
			</tr>
			${clients.map((client, index) => `
				<tr>
					<td><pre>${index}</pre></td>
					<td><pre>${client.remoteAddress}</pre></td>
					<td><pre>${client.loopback}</pre></td>
				</tr>
			`).join('')}
		</table>
	`);
});

// app.post

app.listen(8080);














})();
import { signal, html, $ } from "../../src";

let count = signal(0);

const $counter = $(html`<p>Count: ${count()}</p>`)
$counter.on("click", () => {
	console.log("Clicked");

	count(count() + 1);
});
$counter.appendTo(document.body);

count((c) => {
	console.log(`Count updated to ${c}`);

	$counter.text(`Count: ${c}`);
})

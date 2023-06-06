const chatboxEl = document.getElementById('chatbox');
const inputEl = document.getElementById('inputbox');
const submitEl = document.getElementById('submit');
const loadingEl = document.getElementById('loading');

submitEl.addEventListener('click', async() => {
	const input = inputEl.value;
	addMessage(input, 'user');
	inputEl.value = '';

	loadingEl.style.display = 'block';

	const response = await getResponseFromAPI(input);

	loadingEl.style.display = 'none';

	addMessage(response, 'chatgpt');
});

function addMessage(text, sender) {
	const messageEl = document.createElement('div');
	messageEl.classList.add('message');
	messageEl.classList.add(`${sender}-message`);
	messageEl.innerHTML = text;
	chatboxEl.appendChild(messageEl);
	chatboxEl.scrollTop = chatboxEl.scrollHeight;
}

async function getResponseFromAPI(input) {
	const endpoint = 'https://api.openai.com/v1/completions';
	const apikey = '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';
	const prompt = input;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apikey}`
		},

		body: JSON.stringify({
			model: "text-davinci-003",
			prompt,
			max_tokens: 4000,
			n: 1,
			stop: null,
			temperature: 0.5,
		}),
	});
	const result = await response.json();
	return result.choices[0].text;
}

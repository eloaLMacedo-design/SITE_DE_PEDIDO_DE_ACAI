'use strict';

// IMPORTANTE: substitua pelo WhatsApp da loja, com código do país e DDD,
// somente números. Exemplo fictício: 5541999999999.
const WHATSAPP_NUMBER = '5541999999999';

const PRECO_ACAI = { '200': 8, '300': 10, '400': 15, '500': 20, '700': 25 };
const PRECO_ADICIONAL = 2;
const LIMITE_ADICIONAIS = { '200': 1, '300': 2, '400': 3, '500': 4, '700': 5 };
const TAXA_CENTRO = 5;
const TAXA_OUTROS_BAIRROS = 10;

const form = document.querySelector('#form-pedido');
const radiosTamanho = [...document.querySelectorAll('input[name="tamanho"]')];
const caixasAdicionais = [...document.querySelectorAll('input[name="adicionais"]')];
const campoNome = document.querySelector('#nome');
const campoTelefone = document.querySelector('#telefone');
const campoBairro = document.querySelector('#bairro');
const campoEndereco = document.querySelector('#endereco');
const campoObservacoes = document.querySelector('#observacoes');
const gradeAdicionais = document.querySelector('#grade-adicionais');
const avisoLimite = document.querySelector('#aviso-limite');
const textoLimite = document.querySelector('#texto-limite');
const mensagemForm = document.querySelector('#mensagem-form');
const secaoPedido = document.querySelector('.conteudo');
const secaoConfirmacao = document.querySelector('#confirmacao');
const botaoWhatsapp = document.querySelector('#botao-whatsapp');

const moeda = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const tamanhoSelecionado = () => document.querySelector('input[name="tamanho"]:checked').value;
const adicionaisSelecionados = () => caixasAdicionais.filter(caixa => caixa.checked).map(caixa => caixa.value);
const normalizar = texto => texto.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function obterTaxaEntrega(bairro) {
  if (!bairro.trim()) return null;
  return normalizar(bairro) === 'centro' ? TAXA_CENTRO : TAXA_OUTROS_BAIRROS;
}

function atualizarResumo() {
  const tamanho = tamanhoSelecionado();
  const selecionados = adicionaisSelecionados();
  const limite = LIMITE_ADICIONAIS[tamanho];
  const valorBase = PRECO_ACAI[tamanho];
  const valorAdicionais = selecionados.length * PRECO_ADICIONAL;
  const taxa = obterTaxaEntrega(campoBairro.value);

  document.querySelector('#resumo-tamanho').textContent = `Açaí ${tamanho} ml`;
  document.querySelector('#resumo-base').textContent = moeda(valorBase);
  document.querySelector('#resumo-adicionais').textContent = `Adicionais (${selecionados.length})`;
  document.querySelector('#resumo-valor-adicionais').textContent = moeda(valorAdicionais);
  document.querySelector('#resumo-bairro').textContent = campoBairro.value.trim()
    ? `Entrega · ${campoBairro.value.trim()}`
    : 'Taxa de entrega (informe o bairro)';
  document.querySelector('#resumo-entrega').textContent = taxa === null ? '—' : moeda(taxa);
  document.querySelector('#total').textContent = moeda(valorBase + valorAdicionais + (taxa ?? 0));

  textoLimite.textContent = `${selecionados.length} de ${limite} ${limite === 1 ? 'adicional selecionado' : 'adicionais selecionados'}`;
  const contadorPontos = document.querySelector('#contador-pontos');
  contadorPontos.replaceChildren(...Array.from({ length: limite }, () => document.createElement('i')));
  document.querySelectorAll('#contador-pontos i').forEach((ponto, indice) => {
    ponto.classList.toggle('ativo', indice < limite);
  });

  // Desabilita opções restantes ao atingir o limite, sem desmarcar as escolhidas.
  caixasAdicionais.forEach(caixa => {
    caixa.disabled = !caixa.checked && selecionados.length >= limite;
  });
  avisoLimite.textContent = selecionados.length >= limite
    ? `Limite de ${limite} adicionais atingido para o copo de ${tamanho} ml.`
    : `Você pode escolher mais ${limite - selecionados.length} ${limite - selecionados.length === 1 ? 'adicional' : 'adicionais'}.`;
  avisoLimite.classList.toggle('limite-atingido', selecionados.length >= limite);
}

function limparErros() {
  ['nome', 'telefone', 'bairro'].forEach(id => {
    document.querySelector(`#erro-${id}`).textContent = '';
    document.querySelector(`#${id}`).classList.remove('invalido');
  });
  mensagemForm.textContent = '';
}

function mostrarErro(id, mensagem) {
  document.querySelector(`#erro-${id}`).textContent = mensagem;
  document.querySelector(`#${id}`).classList.add('invalido');
}

function validarFormulario() {
  limparErros();
  let valido = true;
  const nome = campoNome.value.trim();
  const telefoneNumeros = campoTelefone.value.replace(/\D/g, '');
  const bairro = campoBairro.value.trim();

  if (nome.length < 2) {
    mostrarErro('nome', 'Informe seu nome completo ou como podemos te identificar.');
    valido = false;
  }
  // Brasil: DDD + 8 ou 9 dígitos. Aceita também o prefixo internacional 55.
  const telefoneNacional = telefoneNumeros.startsWith('55') && telefoneNumeros.length >= 12
    ? telefoneNumeros.slice(2)
    : telefoneNumeros;
  if (!/^\d{10,11}$/.test(telefoneNacional) || /^\d{2}0{8,9}$/.test(telefoneNacional)) {
    mostrarErro('telefone', 'Digite um telefone válido com DDD. Ex.: (41) 99999-9999.');
    valido = false;
  }
  if (bairro.length < 2) {
    mostrarErro('bairro', 'Informe o bairro para calcular a taxa de entrega.');
    valido = false;
  }
  if (adicionaisSelecionados().length > LIMITE_ADICIONAIS[tamanhoSelecionado()]) {
    mensagemForm.textContent = 'A quantidade de adicionais ultrapassa o limite do tamanho escolhido.';
    valido = false;
  }
  if (!valido) {
    mensagemForm.textContent = 'Confira os campos destacados antes de confirmar o pedido.';
    document.querySelector('.campo .invalido')?.focus();
  }
  return valido;
}

function criarDetalhe(rotulo, valor) {
  const linha = document.createElement('div');
  linha.className = 'detalhe-linha';
  const texto = document.createElement('span');
  texto.textContent = rotulo;
  const dado = document.createElement('strong');
  dado.textContent = valor;
  linha.append(texto, dado);
  return linha;
}

function prepararConfirmacao() {
  const tamanho = tamanhoSelecionado();
  const adicionais = adicionaisSelecionados();
  const taxa = obterTaxaEntrega(campoBairro.value);
  const base = PRECO_ACAI[tamanho];
  const totalAdicionais = adicionais.length * PRECO_ADICIONAL;
  const total = base + totalAdicionais + taxa;
  const telefoneNumeros = campoTelefone.value.replace(/\D/g, '');
  const telefoneNacional = telefoneNumeros.startsWith('55') && telefoneNumeros.length >= 12
    ? telefoneNumeros.slice(2)
    : telefoneNumeros;

  const detalhes = document.querySelector('#confirmacao-detalhes');
  detalhes.replaceChildren();
  detalhes.append(
    criarDetalhe('Cliente', campoNome.value.trim()),
    criarDetalhe('Telefone', campoTelefone.value.trim()),
    criarDetalhe('Bairro', campoBairro.value.trim()),
    criarDetalhe('Endereço', campoEndereco.value.trim() || 'Não informado'),
    criarDetalhe(`Açaí ${tamanho} ml`, moeda(base)),
    criarDetalhe(`Adicionais${adicionais.length ? `: ${adicionais.join(', ')}` : ''}`, moeda(totalAdicionais)),
    criarDetalhe('Taxa de entrega', moeda(taxa)),
    criarDetalhe('TOTAL', moeda(total))
  );
  if (campoObservacoes.value.trim()) detalhes.append(criarDetalhe('Observações', campoObservacoes.value.trim()));

  const mensagem = [
    '*PEDIDO - AÇAÍ DO BAIRRO*',
    '',
    `Cliente: ${campoNome.value.trim()}`,
    `Telefone: ${telefoneNacional}`,
    `Bairro: ${campoBairro.value.trim()}`,
    `Endereço: ${campoEndereco.value.trim() || 'Não informado'}`,
    `Açaí: ${tamanho} ml - ${moeda(base)}`,
    `Adicionais: ${adicionais.length ? adicionais.join(', ') : 'Nenhum'} - ${moeda(totalAdicionais)}`,
    `Entrega: ${moeda(taxa)}`,
    `*TOTAL: ${moeda(total)}*`,
    campoObservacoes.value.trim() ? `Observações: ${campoObservacoes.value.trim()}` : ''
  ].filter(Boolean).join('\n');

  botaoWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  const numeroConfigurado = /^\d{12,13}$/.test(WHATSAPP_NUMBER) && !WHATSAPP_NUMBER.endsWith('999999999');
  botaoWhatsapp.classList.toggle('botao-desativado', !numeroConfigurado);
  botaoWhatsapp.setAttribute('aria-disabled', String(!numeroConfigurado));
  if (!numeroConfigurado) {
    botaoWhatsapp.href = '#';
    botaoWhatsapp.title = 'Configure o número de WhatsApp da loja no arquivo script.js.';
    document.querySelector('.nota-whatsapp').textContent = 'O resumo foi preparado. Para habilitar o envio, configure o número real da loja na constante WHATSAPP_NUMBER no arquivo script.js.';
  } else {
    botaoWhatsapp.removeAttribute('title');
    document.querySelector('.nota-whatsapp').textContent = 'Para a loja receber seu pedido, toque no botão abaixo e envie a mensagem no WhatsApp.';
  }
  document.querySelector('#texto-confirmacao').textContent = `Pedido de ${campoNome.value.trim()} preparado com o total de ${moeda(total)}.`;
  secaoPedido.classList.add('escondido');
  secaoConfirmacao.classList.remove('escondido');
  secaoConfirmacao.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

radiosTamanho.forEach(radio => radio.addEventListener('change', atualizarResumo));
caixasAdicionais.forEach(caixa => caixa.addEventListener('change', () => {
  const selecionados = adicionaisSelecionados();
  const limite = LIMITE_ADICIONAIS[tamanhoSelecionado()];
  // Proteção extra para impedir ultrapassar o limite, mesmo se o HTML for alterado.
  if (selecionados.length > limite) caixa.checked = false;
  atualizarResumo();
}));
campoBairro.addEventListener('input', atualizarResumo);

campoTelefone.addEventListener('input', () => {
  let numeros = campoTelefone.value.replace(/\D/g, '').slice(0, 11);
  if (numeros.length > 10) {
    campoTelefone.value = numeros.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
  } else if (numeros.length > 6) {
    campoTelefone.value = numeros.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
  } else if (numeros.length > 2) {
    campoTelefone.value = numeros.replace(/^(\d{2})(\d*)/, '($1) $2');
  } else {
    campoTelefone.value = numeros ? `(${numeros}` : '';
  }
});

form.addEventListener('submit', evento => {
  evento.preventDefault();
  if (!validarFormulario()) return;
  prepararConfirmacao();
});

botaoWhatsapp.addEventListener('click', evento => {
  if (botaoWhatsapp.getAttribute('aria-disabled') === 'true') {
    evento.preventDefault();
    document.querySelector('.nota-whatsapp').textContent = 'Abra o arquivo script.js e troque o número fictício pela linha de WhatsApp da loja, incluindo 55 + DDD + número.';
  }
});

document.querySelector('#novo-pedido').addEventListener('click', () => {
  form.reset();
  limparErros();
  secaoConfirmacao.classList.add('escondido');
  secaoPedido.classList.remove('escondido');
  atualizarResumo();
  document.querySelector('#pedido').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

atualizarResumo();

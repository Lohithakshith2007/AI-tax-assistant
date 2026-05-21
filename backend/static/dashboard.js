/* --- GLOBAL TOAST SYSTEM --- */
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-custom toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

/* --- REFRESH INSIGHTS HANDLER --- */
window.refreshInsights = function (btn) {
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
        btn.disabled = true;
    }

    showToast("AI is analyzing your latest data...", "success");

    setTimeout(() => {
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.classList.remove('fa-spin');
            btn.disabled = false;
        }
    }, 1500);
}

document.addEventListener("DOMContentLoaded", () => {

    /* --- SIDEBAR TOGGLE --- */
    const sidebar = document.getElementById('appSidebar');
    const toggleBtn = document.getElementById('toggleSidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // Capture Django messages and turn them into toasts
    const djangoMessages = document.querySelectorAll('.django-message-data');
    djangoMessages.forEach(msg => {
        showToast(msg.textContent.trim(), msg.dataset.level === 'success' ? 'success' : 'error');
        msg.remove();
    });

    /* --- USER DROPDOWN (TOPBAR) --- */
    const dropdownTrigger = document.getElementById('dropdownTrigger');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownMenu.contains(e.target) && !dropdownTrigger.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    /* --- ACTIVE LINKS --- */
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    /* --- CURRENCY MAPPING & DYNAMIC SYMBOLS --- */
    const CURRENCY_MAP = {
        'india': '₹', 'in': '₹', 'inr': '₹',
        'us': '$', 'usa': '$', 'usd': '$',
        'uk': '£', 'gbp': '£',
        'canada': 'C$', 'cad': 'C$',
        'australia': 'A$', 'aud': 'A$',
        'europe': '€', 'eu': '€', 'eur': '€'
    };

    function updateCurrencySymbols(country) {
        const symbol = CURRENCY_MAP[country.toLowerCase()] || '$';
        document.querySelectorAll('.dynamic-currency').forEach(el => {
            el.textContent = symbol;
        });
    }

    /* --- CUSTOM IMPRESSIVE DROPDOWN --- */
    function initCustomSelects() {
        document.querySelectorAll('select:not(.no-custom)').forEach(select => {
            if (select.parentElement.classList.contains('custom-select-container')) return;

            const container = document.createElement('div');
            container.className = 'custom-select-container';
            select.parentNode.insertBefore(container, select);
            container.appendChild(select);
            select.style.display = 'none';

            const trigger = document.createElement('div');
            trigger.className = 'custom-select-trigger';
            trigger.innerHTML = `<span>${select.options[select.selectedIndex].text}</span> <i class="fa-solid fa-chevron-down"></i>`;
            container.appendChild(trigger);

            const optionsList = document.createElement('div');
            optionsList.className = 'custom-options';

            Array.from(select.options).forEach((opt, idx) => {
                const oDiv = document.createElement('div');
                oDiv.className = `custom-option ${opt.selected ? 'selected' : ''}`;
                oDiv.textContent = opt.text;
                oDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    select.selectedIndex = idx;
                    trigger.querySelector('span').textContent = opt.text;
                    optionsList.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
                    oDiv.classList.add('selected');
                    container.classList.remove('active');

                    // Trigger native change event
                    select.dispatchEvent(new Event('change'));
                });
                optionsList.appendChild(oDiv);
            });
            container.appendChild(optionsList);

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.custom-select-container').forEach(c => {
                    if (c !== container) c.classList.remove('active');
                });
                container.classList.toggle('active');
            });
        });
    }

    initCustomSelects();
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('active'));
    });

    // Special listener for Country selection to update symbols
    const mainCountrySelect = document.querySelector('select[name="country"], select[name="default_country"]');
    if (mainCountrySelect) {
        mainCountrySelect.addEventListener('change', function () {
            updateCurrencySymbols(this.value);
        });
        // Initial set
        updateCurrencySymbols(mainCountrySelect.value);
    }

    /* --- HISTORY SEARCH --- */
    const searchInput = document.querySelector('.search-wrapper input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            const filter = this.value.toLowerCase();
            const rows = document.querySelectorAll('#historyTable tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });
    }

    /* --- DYNAMIC AI INSIGHTS --- */
    window.refreshInsights = async function (btn) {
        const aiBox = btn.closest('.card').querySelector('.ai-box');
        const content = aiBox.querySelector('#aiInsightText');

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Analyzing Profile...';
        aiBox.classList.add('shimmer');

        try {
            const response = await fetch('/dashboard/profile/insights/');
            const data = await response.json();

            if (content) {
                // Restore professional formatting with marked.js but keep it muted/sm
                content.innerHTML = `
                    <div class="ai-rendered-content text-sm text-muted fade-in">
                        ${marked.parse(data.insight)}
                    </div>
                `;
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load AI insights.', 'error');
        } finally {
            aiBox.classList.remove('shimmer');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Refresh Insight';
        }
    }

    const taxForm = document.getElementById('taxCalcForm');
    const calcBtn = document.getElementById('calcBtn');
    const LAST_CALC_KEY = 'ai_tax_last_calculation';

    window.clearLastCalculation = function () {
        sessionStorage.removeItem(LAST_CALC_KEY);
    }

    // Helper to restore last calculation on load
    function restoreLastCalculation() {
        const saved = sessionStorage.getItem(LAST_CALC_KEY);
        if (saved && taxForm) {
            const { inputs, results } = JSON.parse(saved);

            // Populate form
            Object.keys(inputs).forEach(key => {
                const input = taxForm.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = inputs[key];
                    // Trigger change for custom selects
                    if (input.tagName === 'SELECT') {
                        const trigger = input.parentElement.querySelector('.custom-select-trigger span');
                        if (trigger) trigger.textContent = input.options[input.selectedIndex].text;
                    }
                }
            });

            // Update currency symbols based on restored country
            updateCurrencySymbols(inputs.country);

            // Display results
            displayResults(results, inputs.country);
        }
    }

    if (taxForm) {
        // Run restoration
        restoreLastCalculation();

        taxForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const globalLoading = document.getElementById('globalLoading');
            if (globalLoading) globalLoading.style.display = 'flex';
            calcBtn.disabled = true;

            const formData = new FormData(taxForm);
            const inputs = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/calculate/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        country: inputs.country,
                        income: parseFloat(inputs.income) || 0,
                        deductions: parseFloat(inputs.deductions) || 0,
                        age: parseInt(inputs.age) || 0
                    })
                });

                const results = await response.json();

                // Save to sessionStorage for current user session only
                sessionStorage.setItem(LAST_CALC_KEY, JSON.stringify({ inputs, results }));

                setTimeout(() => {
                    if (globalLoading) globalLoading.style.display = 'none';
                    displayResults(results, inputs.country);
                }, 800);
            } catch (error) {
                if (globalLoading) globalLoading.style.display = 'none';
                showToast('Calculation failed. Check your data.', 'error');
            } finally {
                calcBtn.disabled = false;
            }
        });
    }

    /* --- MODAL SYSTEM --- */
    window.openModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        }
    }

    window.closeModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    /* --- PASSWORD TOOLS --- */
    window.togglePassword = function (inputId, icon) {
        const input = document.getElementById(inputId);
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    const passwordRules = {
        length: pass => pass.length >= 8,
        uppercase: pass => /[A-Z]/.test(pass),
        lowercase: pass => /[a-z]/.test(pass),
        number: pass => /[0-9]/.test(pass),
        special: pass => /[^A-Za-z0-9]/.test(pass),
    };

    window.checkPasswordStrength = function (pass, meterId) {
        const bar = document.getElementById(meterId).querySelector('.strength-bar');
        const strengthLabel = document.getElementById('strengthLabel');
        const confirmValue = document.getElementById('new_password2').value;
        const matchText = document.getElementById('passwordMatchText');
        const validationMessage = document.getElementById('passwordValidationMessage');
        const newPasswordInput = document.getElementById('new_password1');
        const confirmPasswordInput = document.getElementById('new_password2');

        const ruleStatus = Object.entries(passwordRules).reduce((acc, [key, test]) => {
            const valid = test(pass);
            const element = document.getElementById(`rule-${key}`);
            if (element) element.classList.toggle('active', valid);
            acc[key] = valid;
            return acc;
        }, {});

        const completedRules = Object.values(ruleStatus).filter(Boolean).length;
        const hasMatch = pass === confirmValue && pass.length > 0;

        if (confirmValue.length) {
            matchText.classList.toggle('valid', hasMatch);
            matchText.textContent = hasMatch ? 'Passwords match.' : 'Passwords do not match.';
            confirmPasswordInput.classList.toggle('valid-input', hasMatch);
            confirmPasswordInput.classList.toggle('invalid-input', !hasMatch);
        } else {
            matchText.classList.remove('valid');
            matchText.textContent = 'Passwords must match.';
            confirmPasswordInput.classList.remove('valid-input', 'invalid-input');
        }

        if (pass.length) {
            newPasswordInput.classList.toggle('valid-input', completedRules === Object.keys(passwordRules).length);
            newPasswordInput.classList.toggle('invalid-input', completedRules < Object.keys(passwordRules).length);
        } else {
            newPasswordInput.classList.remove('valid-input', 'invalid-input');
        }

        let strengthState = 'weak';
        let label = 'Weak';
        if (completedRules === Object.keys(passwordRules).length) {
            strengthState = 'very-strong';
            label = 'Very Strong';
        } else if (completedRules >= 4) {
            strengthState = 'strong';
            label = 'Strong';
        } else if (completedRules >= 3) {
            strengthState = 'medium';
            label = 'Medium';
        }

        if (!pass.length) {
            bar.className = 'strength-bar';
        } else {
            bar.className = `strength-bar ${strengthState}`;
        }
        strengthLabel.textContent = pass.length ? label : '';
        updatePasswordSubmitState();
        if (validationMessage) validationMessage.style.display = 'none';
    }

    window.validatePasswordMatch = function () {
        const password = document.getElementById('new_password1').value;
        window.checkPasswordStrength(password, 'strengthMeter');
    }

    window.updatePasswordSubmitState = function () {
        const newPassword = document.getElementById('new_password1').value;
        const confirmPassword = document.getElementById('new_password2').value;
        const submitButton = document.getElementById('passwordSubmitBtn');

        const validRules = Object.values(passwordRules).every(test => test(newPassword));
        const passwordsMatch = newPassword && newPassword === confirmPassword;
        submitButton.disabled = !(validRules && passwordsMatch);
        return !submitButton.disabled;
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    let passwordAlertTimer = null;

    window.submitChangePassword = async function (event) {
        event.preventDefault();
        const submitButton = document.getElementById('passwordSubmitBtn');
        const validationMessage = document.getElementById('passwordValidationMessage');
        const form = document.getElementById('changePasswordForm');

        if (!window.updatePasswordSubmitState()) {
            validationMessage.innerHTML = '<p>Complete all password rules and make sure passwords match before submitting.</p>';
            validationMessage.style.display = 'block';
            clearTimeout(passwordAlertTimer);
            passwordAlertTimer = setTimeout(() => {
                validationMessage.style.display = 'none';
            }, 6000);
            showToast('Fix the password rules before submitting.', 'error');
            return false;
        }

        const formData = new FormData(form);
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {
            const endpoint = form.getAttribute('action') || window.location.pathname;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                const errors = data.errors || [data.message || 'Unable to update password.'];
                validationMessage.innerHTML = errors.map(error => `<p>${error}</p>`).join('');
                validationMessage.style.display = 'block';
                clearTimeout(passwordAlertTimer);
                passwordAlertTimer = setTimeout(() => {
                    validationMessage.style.display = 'none';
                }, 6000);
                showToast('Unable to update password.', 'error');
                return false;
            }

            validationMessage.style.display = 'none';
            submitButton.classList.remove('loading');
            showToast(data.message || 'Password updated successfully.', 'success');
            form.reset();
            document.getElementById('strengthMeter').querySelector('.strength-bar').className = 'strength-bar';
            document.getElementById('strengthLabel').textContent = '';
            document.getElementById('passwordMatchText').classList.remove('valid');
            document.getElementById('passwordMatchText').textContent = 'Passwords must match.';
            document.querySelectorAll('.password-rule-item').forEach(item => item.classList.remove('active'));
            document.getElementById('new_password1').classList.remove('valid-input', 'invalid-input');
            document.getElementById('new_password2').classList.remove('valid-input', 'invalid-input');
            clearTimeout(passwordAlertTimer);
            passwordAlertTimer = setTimeout(() => {
                validationMessage.style.display = 'none';
            }, 6000);
            setTimeout(() => {
                submitButton.disabled = true;
            }, 100);
            return true;
        } catch (error) {
            validationMessage.innerHTML = '<p>Unable to communicate with the server. Try again.</p>';
            validationMessage.style.display = 'block';
            clearTimeout(passwordAlertTimer);
            passwordAlertTimer = setTimeout(() => {
                validationMessage.style.display = 'none';
            }, 6000);
            showToast('Network error while updating password.', 'error');
            return false;
        } finally {
            submitButton.classList.remove('loading');
            window.updatePasswordSubmitState();
        }
    }
});

function displayResults(data, country) {
    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.style.display = 'block';
    resultsPanel.classList.add('fade-in');

    // Currency symbol update
    const CURRENCY_MAP = {
        'india': '₹', 'in': '₹', 'inr': '₹',
        'us': '$', 'usa': '$', 'usd': '$',
        'uk': '£', 'gbp': '£',
        'canada': 'C$', 'cad': 'C$',
        'australia': 'A$', 'aud': 'A$',
        'europe': '€', 'eu': '€', 'eur': '€'
    };
    const symbol = CURRENCY_MAP[country.toLowerCase()] || '₹';

    document.querySelectorAll('.results-currency').forEach(el => el.textContent = symbol);
    document.getElementById('resTaxable').textContent = (data.taxable_income || 0).toLocaleString();
    document.getElementById('resTax').textContent = (data.estimated_tax || 0).toLocaleString();

    const tableBody = document.querySelector('#slabsTable tbody');
    tableBody.innerHTML = '';
    data.tax_breakdown.forEach(slab => {
        tableBody.innerHTML += `
            <tr>
                <td>${slab.lower_limit.toLocaleString()}</td>
                <td>${slab.upper_limit ? slab.upper_limit.toLocaleString() : 'Above'}</td>
                <td>${(slab.rate * 100).toFixed(1)}%</td>
                <td class="text-accent">${symbol}${slab.tax_for_this_slab.toLocaleString()}</td>
            </tr>
        `;
    });

    // Render AI suggestions with proper formatting
    const aiContent = document.getElementById('aiSuggestions');
    if (typeof marked !== 'undefined') {
        aiContent.innerHTML = `<div class="ai-rendered-content">${marked.parse(data.ai_suggestions)}</div>`;
    } else {
        aiContent.innerHTML = `<p class="text-sm text-muted">${data.ai_suggestions}</p>`;
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

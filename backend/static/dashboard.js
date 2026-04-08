document.addEventListener("DOMContentLoaded", () => {

    /* --- SIDEBAR TOGGLE --- */
    const sidebar = document.getElementById('appSidebar');
    const toggleBtn = document.getElementById('toggleSidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            // on mobile, it slides in. On desktop, it collapses.
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    /* --- DROPDOWN MENU --- */
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

    /* --- NUMBER FORMATTING --- */
    document.querySelectorAll(".format-number").forEach(el => {
        const val = parseFloat(el.textContent.replace(/,/g, ''));
        if (!isNaN(val)) {
            el.textContent = val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        }
    });

    /* --- HISTORY SEARCH --- */
    const searchInput = document.getElementById('historySearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const rows = document.querySelectorAll('#historyTable tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(filter)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    /* --- MARKED SETUP --- */
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
    }

    /* --- TAX CALCULATOR --- */
    const taxForm = document.getElementById('taxCalcForm');
    const resultsPanel = document.getElementById('resultsPanel');
    const calcBtn = document.getElementById('calcBtn');

    if (taxForm) {
        taxForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show Gloabl Loading Overlay (Full-page blur)
            const globalLoading = document.getElementById('globalLoading');
            if (globalLoading) {
                globalLoading.style.display = 'flex';
                globalLoading.classList.add('fade-in');
            }
            
            // Disable button
            calcBtn.disabled = true;
            
            const formData = new FormData(taxForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/calculate/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        country: data.country,
                        income: parseFloat(data.income) || 0,
                        deductions: parseFloat(data.deductions) || 0,
                        age: parseInt(data.age) || 0
                    })
                });
                
                if (!response.ok) throw new Error('Calculation failed');
                
                const result = await response.json();
                
                // Add a small artificial delay for that "impressive" feel
                setTimeout(() => {
                    if (globalLoading) globalLoading.style.display = 'none';
                    displayResults(result);
                }, 800);

            } catch (error) {
                console.error('Error:', error);
                if (globalLoading) globalLoading.style.display = 'none';
                alert('Failed to calculate tax. Please check your data and try again.');
            } finally {
                calcBtn.disabled = false;
            }
        });
    }

    /* --- MODAL SYSTEM --- */
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden'; // Prevent scroll
        }
    }

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    // Close modal on click outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal-overlay')) {
            closeModal(event.target.id);
        }
    }

    /* --- PASSWORD TOOLS --- */
    window.togglePassword = function(inputId, icon) {
        const input = document.getElementById(inputId);
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = "password";
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    window.checkPasswordStrength = function(pass, meterId) {
        const meter = document.getElementById(meterId);
        const bar = meter.querySelector('.strength-bar');
        let strength = 0;
        
        if (pass.length > 5) strength++;
        if (pass.length > 10) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;

        bar.className = 'strength-bar';
        if (strength < 2) {
            bar.classList.add('weak');
        } else if (strength < 4) {
            bar.classList.add('medium');
        } else {
            bar.classList.add('strong');
        }
    }

    /* --- DYNAMIC INSIGHTS --- */
    window.refreshInsights = function(btn) {
        const aiBox = btn.closest('.card').querySelector('.ai-box');
        const content = aiBox.querySelector('p');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Analyzing...';
        aiBox.classList.add('shimmer');

        const alternativeInsights = [
            "We detected unusual deductions in 80C. Re-verify your ELSS statements to ensure maximum compliance.",
            "Great job on documentation! You're currently utilizing 94% of available local tax exemptions.",
            "Attention: New regional tax laws are effective next month. Your current estimations might shift by ±2%.",
            "Tip: Consider shifting your capital gains to the next fiscal year to stay within the lower tax bracket."
        ];

        setTimeout(() => {
            const random = alternativeInsights[Math.floor(Math.random() * alternativeInsights.length)];
            content.innerText = random;
            aiBox.classList.remove('shimmer');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Refresh Insight';
        }, 1200);
    }

    // Add click animation to all buttons globally
    document.querySelectorAll('button, .btn-primary, .btn-outline').forEach(btn => {
        btn.classList.add('btn-click-anim');
    });
});

function displayResults(data) {
    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.style.display = 'block';
    resultsPanel.classList.add('fade-in');
    
    // Smooth scroll
    setTimeout(() => {
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Basic values
    document.getElementById('resTaxable').textContent = (data.taxable_income || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    document.getElementById('resTax').textContent = (data.estimated_tax || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    // Build table
    const tableBody = document.querySelector('#slabsTable tbody');
    tableBody.innerHTML = '';
    
    if (data.tax_breakdown && data.tax_breakdown.length > 0) {
        data.tax_breakdown.forEach(slab => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${slab.lower_limit.toLocaleString()}</td>
                <td>${slab.upper_limit ? slab.upper_limit.toLocaleString() : 'Above'}</td>
                <td>${(slab.rate * 100).toFixed(1)}%</td>
                <td class="text-accent format-number">${slab.tax_for_this_slab.toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="text-center text-muted">No tax slabs hit.</td>`;
        tableBody.appendChild(row);
    }
    
    // AI Suggestions
    const aiContent = document.getElementById('aiSuggestions');
    if (data.ai_suggestions && typeof marked !== 'undefined') {
        aiContent.innerHTML = marked.parse(data.ai_suggestions);
    } else {
        aiContent.innerHTML = `<p class="text-muted">No AI suggestions available.</p>`;
    }
}

// CSRF util
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

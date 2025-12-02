// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://khoyztycmrryrkbsvhja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZyR1Q69Dg7sIkTR7AhnXeg_5CDqKWsZ';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentBriefingId = null;
let projectData = null;

// --- INIT ---

window.onload = async function() {
    // Get ID from URL query params: briefing.html?id=XYZ
    const urlParams = new URLSearchParams(window.location.search);
    currentBriefingId = urlParams.get('id');

    if (!currentBriefingId) {
        showError();
        return;
    }

    await loadProjectData(currentBriefingId);
};

async function loadProjectData(id) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) throw error;

        projectData = data;
        
        // Update UI with Project Info
        document.getElementById('briefingTitle').textContent = `Briefing de Start | ${data.client_name}`;
        document.title = `Briefing | ${data.client_name}`;

        // Update Drive Link if present
        if (data.briefing_data && data.briefing_data.admin_drive_link) {
            const driveBtn = document.getElementById('driveBtn');
            driveBtn.href = data.briefing_data.admin_drive_link;
            // Make it obvious
            driveBtn.innerHTML = `<i class="fab fa-google-drive"></i> ACESSAR PASTA DO CLIENTE`;
        }

        // Show Form
        document.getElementById('loadingBriefing').style.display = 'none';
        document.getElementById('briefingContent').style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        showError();
    }
}

function showError() {
    document.getElementById('loadingBriefing').style.display = 'none';
    document.getElementById('errorBriefing').style.display = 'block';
}

// --- FORM LOGIC ---

async function submitBriefing() {
    if (!currentBriefingId) return;

    if (!validateCurrentStep()) {
        return;
    }

    const btn = document.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando Briefing...';
    btn.disabled = true;

    try {
        const form = document.getElementById('briefingForm');
        const formData = new FormData(form);
        
        // Start with existing briefing_data to preserve admin_drive_link
        const dataObj = projectData.briefing_data || {};
        
        formData.forEach((value, key) => {
            if (dataObj[key]) {
                if (!Array.isArray(dataObj[key])) { dataObj[key] = [dataObj[key]]; }
                dataObj[key].push(value);
            } else {
                dataObj[key] = value;
            }
        });
        
        const { error } = await supabase
            .from('projects')
            .update({ 
                briefing_data: dataObj,
                status: 'Concluído',
                completed_at: new Date().toISOString()
            })
            .eq('id', currentBriefingId);

        if (error) throw error;
        
        document.getElementById('successModal').style.display = 'flex';
        document.getElementById('briefingForm').innerHTML = '';

    } catch (error) {
        console.error('Erro ao enviar briefing:', error);
        alert('Ocorreu um erro ao salvar o briefing.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- NAVIGATION & UI ---

let currentStep = 1;
const totalSteps = 6;

function nextStep(step) {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateBriefingUI();
        }
    }
}

function prevStep(step) {
    if (currentStep > 1) {
        currentStep--;
        updateBriefingUI();
    }
}

function updateBriefingUI() {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (currentStepEl) currentStepEl.classList.add('active');

    const progressPercentage = ((currentStep) / totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progressPercentage}%`;

    document.querySelectorAll('.step-label').forEach((label, index) => {
        const isActive = index + 1 === currentStep;
        const isCompleted = index + 1 < currentStep;
        
        label.classList.toggle('active', isActive);
        label.style.color = isActive ? 'var(--neon-green)' : (isCompleted ? 'var(--neon-purple)' : 'var(--text-gray)');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (!currentStepEl) return true;

    const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        input.style.borderColor = 'var(--glass-border)';
        
        let isInputValid = true;
        if (input.type === 'checkbox') {
            if (!input.checked) isInputValid = false;
        } else if (input.type === 'radio') {
            const name = input.name;
            const checked = currentStepEl.querySelector(`input[name="${name}"]:checked`);
            if (!checked) isInputValid = false;
        } else {
            if (!input.value.trim()) isInputValid = false;
        }

        if (!isInputValid) {
            isValid = false;
            input.style.borderColor = 'red';
            // Shake effect
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        }
    });

    if (!isValid) {
        alert('Por favor, preencha todos os campos obrigatórios (*).');
    }

    return isValid;
}

// Input Masks
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.phone-mask').forEach(phoneInput => {
        phoneInput.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    });

    document.querySelectorAll('.money-mask').forEach(moneyInput => {
        moneyInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = (value / 100).toFixed(2) + '';
            value = value.replace(".", ",");
            value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
            e.target.value = 'R$ ' + value;
        });
    });
});


import { Student, StudentGeneralLevel, ProgramName, MembershipPlanDefinition } from './types'; 
import { v4 as uuidv4 } from 'uuid'; 

export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3000) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '10000'; 
        document.body.appendChild(container);
        toastContainer = container; 
    }
    
    if(!toastContainer) return;


    const toast = document.createElement('div');
    let bgColor = '';
    let textColor = 'white';

    switch(type) {
        case 'success':
            bgColor = '#10B981'; // brand-success
            break;
        case 'error':
            bgColor = '#EF4444'; // brand-error
            break;
        case 'warning':
            bgColor = '#F59E0B'; // brand-warning
            break;
        case 'info':
        default:
            bgColor = '#3B82F6'; // brand-info
            break;
    }

    toast.style.backgroundColor = bgColor;
    toast.style.color = textColor;
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.marginBottom = '10px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    toast.style.transform = 'translateX(100%)';


    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    toastContainer.appendChild(toast);
    
    void toast.offsetHeight; 

    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';


    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300); 
    }, duration);
}

export function calculateAge(dob: string): number | null {
    if (!dob) return null;
    try {
        // Appending 'T00:00:00' ensures the date is parsed in the local timezone,
        // preventing it from shifting to the previous day in timezones west of UTC.
        const birthDate = new Date(dob + 'T00:00:00');
        const today = new Date();
        if (isNaN(birthDate.getTime())) return null;

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch (e) {
        return null;
    }
}

export function getLocalDateString(date: Date = new Date()): string {
    // This function formats a Date object into 'YYYY-MM-DD' string based on the client's local timezone,
    // avoiding the UTC conversion issues of .toISOString().
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


export function getDerivedGeneralLevel(student: Student | null): StudentGeneralLevel {
    if (!student || !student.program) return 'Principiante';
    switch (student.program) {
        case 'New Stars':
        case 'Little Giants':
            return 'Principiante';
        case 'Dancers':
            if (!student.dancerLevel) return 'Intermedio'; 
            switch (student.dancerLevel) {
                case 'Explorer 1':
                case 'Explorer 2':
                    return 'Intermedio';
                case 'Explorer 3':
                    return 'Avanzado';
                case 'Deep':
                    return 'Profesional';
                default:
                    return 'Intermedio';
            }
        default:
            return 'Principiante';
    }
}

export function getMembershipClassLimit(
    planId: string | null | undefined,
    allPlans: MembershipPlanDefinition[]
): number {
    if (!planId || !allPlans || allPlans.length === 0) return 0;
    
    const plan = allPlans.find(p => p.id === planId);
    if (plan) {
        return plan.classesPerWeek;
    }
    return 0; // Default if plan not found or some other issue
}


export function requestMembershipUpdate(
    lastUpdateMonth: number, 
    hasMadeUpdate: boolean,
    toastFn: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void = showToast
): { canUpdate: boolean, currentMonth: number } {
    const currentMonth = new Date().getMonth();
    let canProceed = true;
    let currentHasMadeUpdate = hasMadeUpdate;

    if (lastUpdateMonth !== currentMonth) {
        currentHasMadeUpdate = false; 
    }

    if (currentHasMadeUpdate) {
        toastFn("Ya has solicitado una actualización de membresía este mes. Podrás solicitar otra el próximo mes.", "info");
        canProceed = false; 
    } else {
        console.log(`Monthly membership update attempt for month: ${currentMonth}. Confirmation pending.`);
    }
    return { canUpdate: canProceed, currentMonth };
}

export function canMakeMonthlyInitiatingClassChange(
    lastChangeMonth: number, 
    hasMadeChange: boolean,
    toastFn: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void = showToast
): boolean {
    const currentMonth = new Date().getMonth();
    let currentHasMadeChange = hasMadeChange;

    if (lastChangeMonth !== currentMonth) {
        currentHasMadeChange = false; 
        console.log("New month detected, monthly class change flag reset.");
    }

    if (currentHasMadeChange) {
        toastFn("Ya has realizado tu cambio de clases mensual (agregar o eliminar una clase). Podrás realizar otro el próximo mes.", "info");
        return false; 
    }
    return true; 
}

export function recordClassScheduleChange(): {hasMadeChange: boolean, lastChangeMonth: number} {
    const currentMonth = new Date().getMonth();
    console.log(`Monthly class schedule INITIATING ACTION recorded for month: ${currentMonth}. Student can now fill deficit if needed.`);
    return { hasMadeChange: true, lastChangeMonth: currentMonth };
}


export function getLevelOrder(level: StudentGeneralLevel): number {
    switch (level) {
        case 'Principiante': return 1;
        case 'Intermedio': return 2;
        case 'Avanzado': return 3;
        case 'Profesional': return 4;
        default: return 0;
    }
}

export function getMembershipPlanUIDetails(
    planId: string | null | undefined,
    allPlans: MembershipPlanDefinition[]
): { name: string, price: string, classes: string, description: string } {
    const defaultDetails = { name: 'N/A', price: 'N/A', classes: 'N/A', description: 'Plan details not available.' };
    if (!planId || !allPlans || allPlans.length === 0) {
        return defaultDetails;
    }

    const plan = allPlans.find(p => p.id === planId);

    if (plan) {
        // Create a generic description based on plan properties
        const description = `This plan offers ${plan.classesPerWeek} class(es) per week for $${parseFloat(String(plan.monthlyPrice)).toFixed(2)} per month.`;
        return {
            name: plan.name,
            price: `$${parseFloat(String(plan.monthlyPrice)).toFixed(2)}/mes`,
            classes: `${plan.classesPerWeek} clase(s)/semana`,
            description: description // Or any other description field if added to MembershipPlanDefinition
        };
    }
    return defaultDetails;
}


/**
 * Formats a time string (HH:mm or HH:mm:ss) to a 12-hour format with AM/PM.
 * @param timeStr The time string to format (e.g., "17:00", "09:30:00").
 * @returns Formatted time string (e.g., "5:00 PM", "9:30 AM").
 */
export function formatTime(timeStr: string): string {
    if (!timeStr) return 'N/A';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) return 'Hora Inválida';

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesFormatted} ${ampm}`;
}

/**
 * Formats a start and end time string into a displayable time range.
 * @param startTimeStr Start time (e.g., "17:00").
 * @param endTimeStr End time (e.g., "18:30").
 * @returns Formatted time range string (e.g., "5:00 PM - 6:30 PM").
 */
export function formatTimeRange(startTimeStr: string, endTimeStr: string): string {
    if (!startTimeStr || !endTimeStr) return 'Horario no especificado';
    return `${formatTime(startTimeStr)} - ${formatTime(endTimeStr)}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function exportToCSV(data: any[], filename: string) {
  if (!Array.isArray(data) || data.length === 0) {
    showToast("No data to export.", "info");
    return;
  }
  
  const headers = Object.keys(data[0]);
  
  const replacer = (key: any, value: any) => value === null ? '' : value; 

  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => 
        JSON.stringify(row[fieldName], replacer)
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Resizes an image file to a maximum width and height while maintaining aspect ratio.
 * @param file The image file to resize.
 * @param maxWidth The maximum width of the output image.
 * @param maxHeight The maximum height of the output image.
 * @param quality The quality of the output JPEG image (0 to 1).
 * @returns A promise that resolves with a Base64 data URL of the resized image.
 */
export const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("FileReader failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context.'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                // Use JPEG for better compression of photos
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
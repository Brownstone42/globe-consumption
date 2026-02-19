import Swal from 'sweetalert2'

const Jarvis = {
    alert: (text, icon = 'info') => {
        return Swal.fire({
            title: 'Jarvis says...',
            text: text,
            icon: icon,
            confirmButtonColor: '#00d1b2'
        })
    },
    success: (text) => {
        return Swal.fire({
            title: 'Jarvis says...',
            text: text,
            icon: 'success',
            confirmButtonColor: '#48c78e'
        })
    },
    error: (text) => {
        return Swal.fire({
            title: 'Jarvis says...',
            text: text,
            icon: 'error',
            confirmButtonColor: '#f14668'
        })
    },
    confirm: async (text, icon = 'warning') => {
        const result = await Swal.fire({
            title: 'Jarvis says...',
            text: text,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: '#00d1b2',
            cancelButtonColor: '#f5f5f5',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            customClass: {
                cancelButton: 'has-text-dark'
            }
        })
        return result.isConfirmed
    },
    toast: (text, icon = 'success') => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        })
        Toast.fire({
            icon: icon,
            title: text
        })
    }
}

export default Jarvis
